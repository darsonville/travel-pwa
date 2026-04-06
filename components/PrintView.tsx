'use client'

import { useEffect, useState } from 'react'
import type { TripBundle, Traveller, Day, Segment } from '@/lib/types'
import {
  XIcon, PrinterIcon, WhatsAppIcon, PlaneIcon, HotelIcon,
  ActivityIcon, MealIcon, BusIcon, MapPinIcon, TimerIcon, TipIcon,
} from './Icons'

type Props = {
  bundle: TripBundle
  onClose: () => void
}

const SEGMENT_ICONS: Record<string, React.ReactNode> = {
  transport: <PlaneIcon className="w-4 h-4" />,
  accommodation: <HotelIcon className="w-4 h-4" />,
  activity: <ActivityIcon className="w-4 h-4" />,
  meal: <MealIcon className="w-4 h-4" />,
  transfer: <BusIcon className="w-4 h-4" />,
}

function formatDayDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '–'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatFlightDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function PrintView({ bundle, onClose }: Props) {
  const { agency, trip, days, segments, flights } = bundle
  const [travellers, setTravellers] = useState<Traveller[]>([])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Fetch travellers
  useEffect(() => {
    fetch(`/api/travellers?trip_id=${encodeURIComponent(trip.trip_id)}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setTravellers)
      .catch(() => {})
  }, [trip.trip_id])

  const sortedDays = [...days].sort(
    (a, b) => Number(a.day_number) - Number(b.day_number)
  )

  const segmentsByDay = (dayId: string): Segment[] =>
    segments
      .filter((s) => s.day_id === dayId)
      .sort((a, b) => Number(a.order) - Number(b.order))

  const sortedFlights = [...flights].sort((a, b) => a.date.localeCompare(b.date))

  // WhatsApp share
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const waMessage = `${trip.title}\n${trip.traveler_name}\n${trip.start_date} → ${trip.end_date}\n\nView your full trip here:\n${appUrl}/trip/${trip.slug}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Top bar — hidden when printing */}
      <div className="print-hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          title="Close"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-sm font-medium"
        >
          <PrinterIcon className="w-4 h-4" /> Print
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-green-50 transition-colors text-green-600"
          title="Share on WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </a>
      </div>

      {/* Printable content */}
      <div id="print-view" className="max-w-[800px] mx-auto px-6 sm:px-10 py-8 print:p-0 print:max-w-full">
        {/* Section 1 — Header */}
        <div className="flex items-start justify-between mb-4">
          {agency.logo_url && (
            <img
              src={agency.logo_url}
              alt={agency.name}
              className="h-12 w-auto object-contain"
            />
          )}
          <span className="px-3 py-1 rounded-full border border-gray-300 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {trip.status === 'booked' ? 'Confirmed' : 'Quote'}
          </span>
        </div>
        <hr className="border-gray-200 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{trip.title}</h1>
        <p className="text-sm text-gray-600 mb-1">
          {trip.traveler_name} &middot; {trip.start_date} &rarr; {trip.end_date}
        </p>
        {trip.description && (
          <p className="text-sm text-gray-500 mt-2">{trip.description}</p>
        )}
        <hr className="border-gray-200 mt-6 mb-8" />

        {/* Section 2 — Itinerary */}
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <PlaneIcon className="w-5 h-5 text-gray-400" /> Itinerary
        </h2>

        {sortedDays.map((day: Day) => {
          const daySegments = segmentsByDay(day.day_id)
          return (
            <div key={day.day_id} className="mb-8">
              <div className="bg-gray-50 print:bg-white px-4 py-2 rounded-lg mb-3">
                <p className="font-semibold text-sm text-gray-900">
                  Day {day.day_number} — {formatDayDate(day.date)}
                </p>
                <p className="text-xs text-gray-500">
                  {day.destination_city}, {day.destination_country}
                </p>
              </div>

              {daySegments.length > 0 ? (
                <div className="space-y-3 pl-4">
                  {daySegments.map((seg: Segment) => (
                    <div key={seg.segment_id} className="flex gap-3">
                      <div className="flex-shrink-0 w-12 text-right">
                        <span className="text-xs font-medium text-gray-400">
                          {seg.time || ''}
                        </span>
                      </div>
                      <div className="flex-shrink-0 text-gray-400 mt-0.5">
                        {SEGMENT_ICONS[seg.type] || <MapPinIcon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{seg.title}</p>
                        {seg.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{seg.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          {seg.location_name && (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" /> {seg.location_name}
                            </span>
                          )}
                          {seg.duration_minutes && (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                              <TimerIcon className="w-3 h-3" /> {seg.duration_minutes} min
                            </span>
                          )}
                        </div>
                        {seg.notes && (
                          <p className="text-xs text-gray-500 mt-1 inline-flex items-start gap-1">
                            <TipIcon className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400" />
                            {seg.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 pl-4">No activities planned.</p>
              )}
            </div>
          )
        })}

        {/* Section 3 — Flights */}
        {sortedFlights.length > 0 && (
          <>
            <hr className="border-gray-200 mb-6" />
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PlaneIcon className="w-5 h-5 text-gray-400" /> Flights
            </h2>
            <div className="space-y-0">
              {sortedFlights.map((flight, i) => (
                <div key={flight.flight_id}>
                  <div className="py-3">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {flight.flight_number}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-sm text-gray-700">
                        {flight.origin_iata} &rarr; {flight.destination_iata}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">
                        {formatFlightDate(flight.date)}
                      </span>
                    </div>
                    {(flight.departure_time || flight.arrival_time) && (
                      <p className="text-xs text-gray-500 mt-1 ml-0">
                        Dep: {flight.departure_time || '–'} &middot; Arr: {flight.arrival_time || '–'}
                      </p>
                    )}
                    {flight.notes && (
                      <p className="text-xs text-gray-400 mt-1">{flight.notes}</p>
                    )}
                  </div>
                  {i < sortedFlights.length - 1 && <hr className="border-gray-100" />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Section 4 — Travellers */}
        {travellers.length > 0 && (
          <>
            <hr className="border-gray-200 mt-6 mb-6" />
            <h2 className="text-lg font-bold text-gray-900 mb-4">Travellers</h2>
            <div className="space-y-6">
              {travellers.map((t) => (
                <div key={t.traveller_id}>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {t.name} {t.surname}
                  </p>
                  <hr className="border-gray-100 mb-2" />
                  <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs">
                    <span className="text-gray-400">Date of birth</span>
                    <span className="text-gray-700">{formatShortDate(t.date_of_birth)}</span>
                    <span className="text-gray-400">Citizenship</span>
                    <span className="text-gray-700">{t.citizenship || '–'}</span>
                    <span className="text-gray-400">Document</span>
                    <span className="text-gray-700">
                      {t.document_type === 'passport' ? 'Passport' : t.document_type === 'national_id' ? 'National ID' : t.document_type}
                      {t.document_number && ` · ${t.document_number}`}
                    </span>
                    <span className="text-gray-400">Expiry</span>
                    <span className="text-gray-700">{formatShortDate(t.document_expiry)}</span>
                    {t.notes && (
                      <>
                        <span className="text-gray-400">Notes</span>
                        <span className="text-gray-700">{t.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <hr className="border-gray-200 mt-8 mb-4" />
        <p className="text-center text-[10px] text-gray-300 mb-8">
          {agency.name} &middot; {appUrl}/trip/{trip.slug}
        </p>
      </div>
    </div>
  )
}
