'use client'

import { useEffect, useState, useRef } from 'react'
import type { TripBundle, Traveller, Day, Segment } from '@/lib/types'
import { extractFileId } from '@/lib/drive'
import {
  PlaneIcon, HotelIcon, ActivityIcon, MealIcon, BusIcon,
  MapPinIcon, TimerIcon, TipIcon,
} from './Icons'
import OverlayView from './OverlayView'

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
  const printContentRef = useRef<HTMLDivElement>(null)
  const [travellers, setTravellers] = useState<Traveller[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [cachedShareUrl, setCachedShareUrl] = useState<string | null>(null)
  const [logoBlob, setLogoBlob] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/travellers?trip_id=${encodeURIComponent(trip.trip_id)}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setTravellers)
      .catch(() => {})
  }, [trip.trip_id])

  // Pre-fetch logo as blob for html2canvas CORS compatibility
  useEffect(() => {
    if (!agency.logo_url) return
    const fileId = extractFileId(agency.logo_url)
    const fetchUrl = fileId ? `/api/drive/${fileId}` : agency.logo_url
    fetch(fetchUrl)
      .then((r) => r.blob())
      .then((blob) => setLogoBlob(URL.createObjectURL(blob)))
      .catch(() => setLogoBlob(null))
  }, [agency.logo_url])

  const sortedDays = [...days].sort(
    (a, b) => Number(a.day_number) - Number(b.day_number)
  )

  const segmentsByDay = (dayId: string): Segment[] =>
    segments
      .filter((s) => s.day_id === dayId)
      .sort((a, b) => Number(a.order) - Number(b.order))

  const sortedFlights = [...flights].sort((a, b) => a.date.localeCompare(b.date))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const openWhatsApp = (url: string) => {
    const message = `${trip.title}\n${trip.traveler_name}\n${trip.start_date} → ${trip.end_date}\n\nFull itinerary:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleWhatsAppShare = async () => {
    if (cachedShareUrl) {
      openWhatsApp(cachedShareUrl)
      return
    }

    if (!printContentRef.current) return
    setIsGenerating(true)

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(printContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      const pageHeight = pdf.internal.pageSize.getHeight()

      let heightLeft = pdfHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }

      const pdfBase64 = pdf.output('datauristring').split(',')[1]

      const res = await fetch('/api/drive/publish-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          fileName: `${trip.slug}-itinerary-${trip.start_date}.pdf`,
          tripId: trip.trip_id,
        }),
      })

      const data = await res.json()

      if (data.shareUrl) {
        setCachedShareUrl(data.shareUrl)
        openWhatsApp(data.shareUrl)
      } else {
        throw new Error('No share URL returned')
      }
    } catch (err) {
      console.error('PDF generation failed:', err)
      openWhatsApp(`${appUrl}/trip/${trip.slug}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <OverlayView
      title={trip.title}
      onClose={onClose}
      onWhatsApp={handleWhatsAppShare}
      isWhatsAppLoading={isGenerating}
      showPrint
    >
      <div ref={printContentRef} id="print-view" className="max-w-[800px] mx-auto px-6 sm:px-10 py-8 print:p-0 print:max-w-full">
        {/* Section 1 — Header */}
        <div className="flex items-start justify-between mb-4">
          {(logoBlob || agency.logo_url) && (
            <img
              src={logoBlob || agency.logo_url}
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
    </OverlayView>
  )
}
