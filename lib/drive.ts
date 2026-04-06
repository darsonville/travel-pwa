/**
 * Rewrites Google Drive URLs to use our authenticated proxy at /api/drive/[fileId].
 *
 * Handles these formats:
 * - https://drive.google.com/file/d/FILE_ID/view...
 * - https://lh3.googleusercontent.com/d/FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID...
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
