/**
 * Extracts the Google Drive file ID from various URL formats.
 * Returns null if the URL is not a recognized Drive URL.
 */
export function extractFileId(url: string): string | null {
  if (!url) return null

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]

  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/)
  if (lh3Match) return lh3Match[1]

  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) return ucMatch[1]

  return null
}

/**
 * Returns a Google Drive native preview URL for iframe embeds.
 * No API call or auth required — loads directly from Google's CDN.
 */
export function drivePreviewUrl(url: string): string {
  if (!url) return ''
  const fileId = extractFileId(url)
  if (!fileId) return url
  return `https://drive.google.com/file/d/${fileId}/preview`
}

/**
 * Rewrites Google Drive URLs to use our authenticated proxy at /api/drive/[fileId].
 * Used for images (logo, photos) where an <img> tag needs a binary response.
 */
export function rewriteDriveUrl(url: string): string {
  if (!url) return url

  // Format: https://drive.google.com/file/d/FILE_ID/...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return `/api/drive/${fileMatch[1]}`

  // Format: https://lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/)
  if (lh3Match) return `/api/drive/${lh3Match[1]}`

  // Format: https://drive.google.com/uc?id=FILE_ID
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) return `/api/drive/${ucMatch[1]}`

  return url
}

/**
 * Rewrites all Google Drive URLs found in a comma-separated string
 * (e.g. photo_urls field with multiple URLs).
 */
export function rewriteDriveUrls(text: string): string {
  if (!text) return text
  return text
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      if (!trimmed) return part
      const rewritten = rewriteDriveUrl(trimmed)
      return rewritten !== trimmed ? part.replace(trimmed, rewritten) : part
    })
    .join(',')
}
