'use client'

import { useEffect } from 'react'
import { XIcon, PrinterIcon, WhatsAppIcon } from './Icons'

type OverlayViewProps = {
  title: string
  onClose: () => void
  whatsappMessage?: string
  onWhatsApp?: () => void
  isWhatsAppLoading?: boolean
  showPrint?: boolean
  children: React.ReactNode
}

export default function OverlayView({
  title,
  onClose,
  whatsappMessage,
  onWhatsApp,
  isWhatsAppLoading = false,
  showPrint = false,
  children,
}: OverlayViewProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleWhatsApp = () => {
    if (onWhatsApp) {
      onWhatsApp()
    } else if (whatsappMessage) {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`,
        '_blank'
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Top bar */}
      <div className="print-hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          title="Close"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-700 truncate px-2">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {showPrint && (
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="Print"
            >
              <PrinterIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleWhatsApp}
            disabled={isWhatsAppLoading}
            className="p-2 rounded-lg hover:bg-green-50 transition-colors text-green-600 disabled:opacity-50"
            title="Share on WhatsApp"
          >
            {isWhatsAppLoading ? (
              <div className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
            ) : (
              <WhatsAppIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {children}
    </div>
  )
}
