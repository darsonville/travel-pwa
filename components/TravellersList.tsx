'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Traveller } from '@/lib/types'
import TravellerCard from './TravellerCard'
import TravellerForm from './TravellerForm'
import { UsersIcon, TrashIcon } from './Icons'

function Skeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-48" />
      <div className="h-3 bg-gray-200 rounded w-40" />
      <div className="h-3 bg-gray-200 rounded w-36" />
    </div>
  )
}

export default function TravellersList({ tripId }: { tripId: string }) {
  const [travellers, setTravellers] = useState<Traveller[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Traveller | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchTravellers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/travellers?trip_id=${encodeURIComponent(tripId)}`)
      if (res.ok) {
        const data = await res.json()
        setTravellers(data)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTravellers()
  }, [fetchTravellers])

  function handleEdit(t: Traveller) {
    setEditing(t)
    setShowForm(true)
  }

  function handleAdd() {
    setEditing(null)
    setShowForm(true)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditing(null)
  }

  function handleFormSaved() {
    setShowForm(false)
    setEditing(null)
    fetchTravellers()
  }

  async function handleDelete(travellerId: string) {
    try {
      await fetch(`/api/travellers/${travellerId}`, { method: 'DELETE' })
      fetchTravellers()
    } catch {
      // silent fail
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
          <UsersIcon className="w-4 h-4 text-gray-400" />
          Travellers {!loading && `(${travellers.length})`}
        </h2>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          + Add
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
        </div>
      ) : travellers.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No travellers added yet.</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Add the first one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {travellers.map((t) => (
            <TravellerCard
              key={t.traveller_id}
              traveller={t}
              onEdit={() => handleEdit(t)}
              onDelete={() => setDeleting(t.traveller_id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleting(null)} />
          <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
            <TrashIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Delete traveller?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TravellerForm
          tripId={tripId}
          traveller={editing}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  )
}
