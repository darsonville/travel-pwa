'use client'

import type { Traveller } from '@/lib/types'
import {
  UserIcon, CalendarIcon, GlobeIcon, DocumentIcon, MessageIcon,
  CheckCircleIcon, AlertTriangleIcon, XCircleIcon, HelpCircleIcon,
} from './Icons'

function expiryStatus(dateStr: string): { label: string; Icon: React.ComponentType<{ className?: string }>; color: string } {
  if (!dateStr) return { label: 'Unknown', Icon: HelpCircleIcon, color: 'text-gray-400' }
  const expiry = new Date(dateStr)
  const now = new Date()
  const months = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth())

  if (expiry < now) return { label: 'Expired', Icon: XCircleIcon, color: 'text-red-600' }
  if (months < 3) return { label: 'Expiring soon', Icon: XCircleIcon, color: 'text-red-600' }
  if (months < 6) return { label: 'Expires in <6 months', Icon: AlertTriangleIcon, color: 'text-yellow-600' }
  return { label: 'Valid', Icon: CheckCircleIcon, color: 'text-green-600' }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '–'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  other: 'Other',
}

type Props = {
  traveller: Traveller
  onEdit: () => void
  onDelete: () => void
}

export default function TravellerCard({ traveller, onEdit, onDelete }: Props) {
  const expiry = expiryStatus(traveller.document_expiry)
  const StatusIcon = expiry.Icon

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <UserIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-sm truncate">
            {traveller.name} {traveller.surname}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-gray-600">
        <p className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(traveller.date_of_birth)}
          {traveller.citizenship && (
            <span className="inline-flex items-center gap-1 ml-2">
              <GlobeIcon className="w-3.5 h-3.5 text-gray-400" /> {traveller.citizenship}
            </span>
          )}
        </p>
        <p className="flex items-center gap-1.5">
          <DocumentIcon className="w-3.5 h-3.5 text-gray-400" />
          {DOC_TYPE_LABELS[traveller.document_type] || traveller.document_type}
          {traveller.document_number && <span> · {traveller.document_number}</span>}
        </p>
        {traveller.document_expiry && (
          <p className="flex items-center gap-1.5">
            <span className="w-3.5" />
            Expires: {formatDate(traveller.document_expiry)}
            <StatusIcon className={`w-3.5 h-3.5 ${expiry.color}`} />
          </p>
        )}
      </div>

      {/* Document link */}
      <div className="mt-3">
        {traveller.document_image_url ? (
          <a
            href={traveller.document_image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            View Document
          </a>
        ) : (
          <p className="text-[11px] text-gray-300">No document uploaded</p>
        )}
      </div>

      {/* Notes */}
      {traveller.notes && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-700 flex items-start gap-2">
          <MessageIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
          <span>{traveller.notes}</span>
        </div>
      )}
    </div>
  )
}
