'use client'

import { useState, useRef } from 'react'
import type { Traveller } from '@/lib/types'

type Props = {
  tripId: string
  traveller?: Traveller | null
  onClose: () => void
  onSaved: () => void
}

export default function TravellerForm({ tripId, traveller, onClose, onSaved }: Props) {
  const isEdit = !!traveller
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: traveller?.name || '',
    surname: traveller?.surname || '',
    date_of_birth: traveller?.date_of_birth || '',
    citizenship: traveller?.citizenship || '',
    document_type: traveller?.document_type || 'passport',
    document_number: traveller?.document_number || '',
    document_expiry: traveller?.document_expiry || '',
    notes: traveller?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.surname.trim()) errs.surname = 'Required'
    if (!form.date_of_birth) errs.date_of_birth = 'Required'
    if (!form.citizenship.trim()) errs.citizenship = 'Required'
    if (!form.document_type) errs.document_type = 'Required'
    if (!form.document_number.trim()) errs.document_number = 'Required'
    if (!form.document_expiry) errs.document_expiry = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setUploadError('')

    try {
      let documentImageUrl = traveller?.document_image_url || ''

      // Upload file if selected
      const file = fileRef.current?.files?.[0]
      if (file) {
        setUploading(true)
        try {
          const fd = new FormData()
          fd.append('file', file)
          const uploadRes = await fetch('/api/travellers/upload', {
            method: 'POST',
            body: fd,
          })
          if (uploadRes.ok) {
            const { url } = await uploadRes.json()
            documentImageUrl = url
          } else {
            const err = await uploadRes.json()
            setUploadError(err.error || 'Upload failed')
          }
        } catch {
          setUploadError('Upload failed')
        } finally {
          setUploading(false)
        }
      }

      const payload = {
        ...form,
        trip_id: tripId,
        document_image_url: documentImageUrl,
      }

      if (isEdit) {
        await fetch(`/api/travellers/${traveller!.traveller_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/travellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      onSaved()
    } catch {
      setUploadError('Failed to save traveller')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {isEdit ? 'Edit Traveller' : 'Add Traveller'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name / Surname */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputClass('name')}
              />
              {errors.name && <p className="text-red-500 text-[11px] mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Surname</label>
              <input
                type="text"
                value={form.surname}
                onChange={(e) => set('surname', e.target.value)}
                className={inputClass('surname')}
              />
              {errors.surname && <p className="text-red-500 text-[11px] mt-0.5">{errors.surname}</p>}
            </div>
          </div>

          {/* DOB / Citizenship */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date of birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
                className={inputClass('date_of_birth')}
              />
              {errors.date_of_birth && <p className="text-red-500 text-[11px] mt-0.5">{errors.date_of_birth}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Citizenship</label>
              <input
                type="text"
                value={form.citizenship}
                onChange={(e) => set('citizenship', e.target.value)}
                className={inputClass('citizenship')}
              />
              {errors.citizenship && <p className="text-red-500 text-[11px] mt-0.5">{errors.citizenship}</p>}
            </div>
          </div>

          {/* Document type / number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Document type</label>
              <select
                value={form.document_type}
                onChange={(e) => set('document_type', e.target.value)}
                className={inputClass('document_type')}
              >
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="other">Other</option>
              </select>
              {errors.document_type && <p className="text-red-500 text-[11px] mt-0.5">{errors.document_type}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Document number</label>
              <input
                type="text"
                value={form.document_number}
                onChange={(e) => set('document_number', e.target.value)}
                className={inputClass('document_number')}
              />
              {errors.document_number && <p className="text-red-500 text-[11px] mt-0.5">{errors.document_number}</p>}
            </div>
          </div>

          {/* Document expiry */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Document expiry</label>
            <input
              type="date"
              value={form.document_expiry}
              onChange={(e) => set('document_expiry', e.target.value)}
              className={inputClass('document_expiry')}
            />
            {errors.document_expiry && <p className="text-red-500 text-[11px] mt-0.5">{errors.document_expiry}</p>}
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Travel document {isEdit && traveller?.document_image_url && '(replace)'}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {uploading && (
              <p className="text-xs text-blue-600 mt-1 animate-pulse">Uploading document...</p>
            )}
            {uploadError && (
              <p className="text-xs text-red-500 mt-1">{uploadError}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {saving ? (uploading ? 'Uploading...' : 'Saving...') : isEdit ? 'Update Traveller' : 'Add Traveller'}
          </button>
        </form>
      </div>
    </div>
  )
}
