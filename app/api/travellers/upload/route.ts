import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Readable } from 'stream'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpg, png, pdf' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      )
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    if (!folderId) {
      return NextResponse.json({ error: 'Drive folder not configured' }, { status: 500 })
    }

    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)

    const driveFile = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${file.name}`,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
      supportsAllDrives: true,
    })

    const fileId = driveFile.data.id!

    // Make the file publicly viewable
    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const url = `https://drive.google.com/file/d/${fileId}/view`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('POST /api/travellers/upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
