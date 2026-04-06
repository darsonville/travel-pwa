import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { Readable } from 'stream'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

// In-memory cache: tripId → shareUrl
const itineraryCache = new Map<string, string>()

export async function POST(request: Request) {
  try {
    const { pdfBase64, fileName, tripId } = await request.json()

    if (!pdfBase64 || !fileName || !tripId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Return cached result
    if (itineraryCache.has(tripId)) {
      return NextResponse.json({ shareUrl: itineraryCache.get(tripId) })
    }

    const folderId = process.env.GOOGLE_DRIVE_PUBLIC_FOLDER_ID
    if (!folderId) {
      return NextResponse.json({ error: 'Public folder not configured' }, { status: 500 })
    }

    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    const driveFile = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/pdf',
        parents: [folderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: Readable.from(pdfBuffer),
      },
      fields: 'id',
      supportsAllDrives: true,
    })

    const fileId = driveFile.data.id!

    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const shareUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    itineraryCache.set(tripId, shareUrl)

    return NextResponse.json({ shareUrl })
  } catch (error) {
    console.error('POST /api/drive/publish-itinerary error:', error)
    return NextResponse.json({ error: 'Failed to publish itinerary' }, { status: 500 })
  }
}
