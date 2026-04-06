'use client'

import { useState, useEffect } from 'react'
import type { Document } from '@/lib/types'
import { extractFileId, drivePreviewUrl } from '@/lib/drive'
import OverlayView from './OverlayView'

type Props = {
  doc: Document
  onClose: () => void
}

export default function DocumentViewer({ doc, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    const prepare = async () => {
      const fileId = extractFileId(doc.url)

      if (!fileId) {
        // Not a Drive URL — use as-is
        setPreviewUrl(doc.url)
        setPreviewReady(true)
        return
      }

      try {
        const res = await fetch('/api/drive/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId }),
        })
        const data = await res.json()
        if (data.shareUrl) setShareUrl(data.shareUrl)
      } catch {
        // Continue even if share fails — preview may still work
      } finally {
        setPreviewUrl(drivePreviewUrl(doc.url))
        setPreviewReady(true)
      }
    }

    prepare()
  }, [doc.url])

  const waMessage = `${doc.name}\n\n${shareUrl || doc.url}`

  return (
    <OverlayView
      title={doc.name}
      onClose={onClose}
      whatsappMessage={waMessage}
    >
      <div className="h-[calc(100vh-56px)] relative">
        {(!previewReady || loading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}
        {previewReady && previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            title={doc.name}
            allow="autoplay"
          />
        )}
      </div>
    </OverlayView>
  )
}
