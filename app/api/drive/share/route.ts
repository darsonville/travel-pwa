import { google } from 'googleapis'
import { NextResponse } from 'next/server'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

// In-memory cache — resets on server restart.
// permissions.create is idempotent so duplicate calls are harmless.
const publicFileCache = new Map<string, string>()

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()

    if (!fileId || typeof fileId !== 'string') {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    if (publicFileCache.has(fileId)) {
      return NextResponse.json({ shareUrl: publicFileCache.get(fileId) })
    }

    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const shareUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    publicFileCache.set(fileId, shareUrl)

    return NextResponse.json({ shareUrl })
  } catch (error) {
    console.error('POST /api/drive/share error:', error)
    return NextResponse.json({ shareUrl: null })
  }
}
