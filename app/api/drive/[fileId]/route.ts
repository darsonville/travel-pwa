import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24h cache for image proxy

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
}

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params

  try {
    const auth = getAuth()
    const drive = google.drive({ version: 'v3', auth })

    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'arraybuffer' }
    )

    const contentType =
      (res.headers['content-type'] as string) || 'application/octet-stream'
    const buffer = Buffer.from(res.data as ArrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 404 }
    )
  }
}
