'use client'

import { useState, useEffect } from 'react'
import type { Flight } from '@/lib/types'
import { PlaneIcon, TimerIcon, NoteIcon, CheckCircleIcon } from './Icons'

// --- AviationStack response types (relevant fields) ---

type LiveEndpoint = {
  airport: string | null
  timezone: string | null
  iata: string | null
  terminal: string | null
  gate: string | null
  baggage?: string | null
  delay: number | null
  scheduled: string | null
  estimated: string | null
  actual: string | null
}

type LiveFlight = {
  flight_date: string
  flight_status: string | null
  departure: LiveEndpoint
  arrival: LiveEndpoint
  airline: { name: string | null; iata: string | null } | null
  flight: { number: string | null; iata: string | null } | null
  aircraft: { registration: string | null; iata: string | null } | null
}

// --- Status badge config ---

const STATUS_STYLES: Record<string, { bg: string; text: string; dot?: boolean }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  active:    { bg: 'bg-green-100', text: 'text-green-700', dot: true },
  landed:    { bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
  diverted:  { bg: 'bg-orange-100', text: 'text-orange-700' },
  incident:  { bg: 'bg-red-200', text: 'text-red-800' },
}

function StatusBadge({ status }: { status: string | null }) {
  const label = status || 'Scheduled'
  const style = STATUS_STYLES[status || 'scheduled'] || STATUS_STYLES.scheduled
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}>
      {style.dot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {label}
    </span>
  )
}

// --- Time formatting ---

function formatTime(isoStr: string | null | undefined, tz: string | null | undefined): string {
  if (!isoStr) return '–'
  try {
    const d = new Date(isoStr)
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz || undefined,
    })
  } catch {
    return isoStr.slice(11, 16) || '–'
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// --- Skeleton ---

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
      <div className="border-t border-dashed border-gray-200 mx-4" />
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="border-t border-dashed border-gray-200 mx-4" />
      <div className="p-4">
        <div className="h-3 bg-gray-200 rounded w-48" />
      </div>
    </div>
  )
}

// --- TimeRow ---

function TimeRow({ label, time, isActual }: { label: string; time: string; isActual?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={isActual && time !== '–' ? 'font-medium text-green-600' : 'text-gray-700'}>
        {time}{isActual && time !== '–' && <CheckCircleIcon className="w-3 h-3 inline ml-0.5 text-green-600" />}
      </span>
    </div>
  )
}

// --- Main component ---

export default function FlightCard({ flight }: { flight: Flight }) {
  const [live, setLive] = useState<LiveFlight | null | undefined>(undefined) // undefined = loading

  useEffect(() => {
    const url = `/api/flights?flight_iata=${encodeURIComponent(flight.flight_number)}&flight_date=${encodeURIComponent(flight.date)}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => setLive(data.live ?? null))
      .catch(() => setLive(null))
  }, [flight.flight_number, flight.date])

  if (live === undefined) return <Skeleton />

  const hasLive = live !== null
  const dep = live?.departure
  const arr = live?.arrival
  const depTz = dep?.timezone || null
  const arrTz = arr?.timezone || null

  const airlineName = live?.airline?.name || null
  const status = live?.flight_status || null
  const aircraftIata = live?.aircraft?.iata || null

  // Time values: prefer live, fall back to sheet (which may be empty)
  const depScheduled = dep?.scheduled ? formatTime(dep.scheduled, depTz) : (flight.departure_time || '–')
  const depEstimated = dep?.estimated ? formatTime(dep.estimated, depTz) : null
  const depActual = dep?.actual ? formatTime(dep.actual, depTz) : null

  const arrScheduled = arr?.scheduled ? formatTime(arr.scheduled, arrTz) : (flight.arrival_time || '–')
  const arrEstimated = arr?.estimated ? formatTime(arr.estimated, arrTz) : null
  const arrActual = arr?.actual ? formatTime(arr.actual, arrTz) : null

  const depDelay = dep?.delay && dep.delay > 0 ? dep.delay : null
  const arrDelay = arr?.delay && arr.delay > 0 ? arr.delay : null
  const maxDelay = Math.max(depDelay || 0, arrDelay || 0)

  const depAirport = dep?.airport || null
  const arrAirport = arr?.airport || null

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <PlaneIcon className="w-4 h-4 text-gray-500" />
            <span className="font-bold text-sm" style={{ color: 'var(--brand-primary)' }}>
              {flight.flight_number}
            </span>
            {airlineName && (
              <span className="text-xs text-gray-400 truncate">
                · {airlineName}
              </span>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{formatDate(flight.date)}</p>
      </div>

      {/* Dashed divider */}
      <div className="relative mx-4">
        <div className="border-t border-dashed border-gray-200" />
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full" />
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-50 rounded-full" />
      </div>

      {/* Departure / Arrival columns */}
      <div className="px-4 py-4 grid grid-cols-2 gap-4">
        {/* Departure */}
        <div className="space-y-1.5">
          <p className="text-2xl font-bold tracking-tight">{flight.origin_iata}</p>
          <p className="text-[11px] text-gray-500 leading-tight truncate">
            {depAirport || 'Departure'}
          </p>
          <div className="mt-2 space-y-1">
            <TimeRow label="Scheduled" time={depScheduled} />
            {depEstimated && depEstimated !== depScheduled && (
              <TimeRow label="Estimated" time={depEstimated} />
            )}
            {depActual && <TimeRow label="Actual" time={depActual} isActual />}
          </div>
          {(dep?.terminal || dep?.gate) && (
            <div className="mt-2 space-y-0.5">
              {dep?.terminal && (
                <p className="text-[11px] text-gray-400">Terminal {dep.terminal}</p>
              )}
              {dep?.gate && (
                <p className="text-[11px] text-gray-400">Gate {dep.gate}</p>
              )}
            </div>
          )}
        </div>

        {/* Arrival */}
        <div className="space-y-1.5">
          <p className="text-2xl font-bold tracking-tight">{flight.destination_iata}</p>
          <p className="text-[11px] text-gray-500 leading-tight truncate">
            {arrAirport || 'Arrival'}
          </p>
          <div className="mt-2 space-y-1">
            <TimeRow label="Scheduled" time={arrScheduled} />
            {arrEstimated && arrEstimated !== arrScheduled && (
              <TimeRow label="Estimated" time={arrEstimated} />
            )}
            {arrActual && <TimeRow label="Actual" time={arrActual} isActual />}
          </div>
          {(arr?.baggage || arr?.terminal) && (
            <div className="mt-2 space-y-0.5">
              {arr?.terminal && (
                <p className="text-[11px] text-gray-400">Terminal {arr.terminal}</p>
              )}
              {arr?.baggage && (
                <p className="text-[11px] text-gray-400">Baggage belt {arr.baggage}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer: delay + aircraft */}
      {(maxDelay > 0 || aircraftIata) && (
        <>
          <div className="border-t border-dashed border-gray-200 mx-4" />
          <div className="px-4 py-3 flex items-center gap-4 flex-wrap text-xs">
            {maxDelay > 0 && (
              <span className={`inline-flex items-center gap-1 ${maxDelay >= 30 ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                <TimerIcon className="w-3.5 h-3.5" /> Delay: +{maxDelay} min
              </span>
            )}
            {aircraftIata && (
              <span className="text-gray-400 inline-flex items-center gap-1">
                <PlaneIcon className="w-3.5 h-3.5" /> Aircraft: {aircraftIata}
              </span>
            )}
          </div>
        </>
      )}

      {/* Notes from sheet */}
      {flight.notes && (
        <>
          <div className="border-t border-dashed border-gray-200 mx-4" />
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 flex items-start gap-1">
              <NoteIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {flight.notes}
            </p>
          </div>
        </>
      )}

      {/* Live data fallback notice */}
      {!hasLive && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-gray-300">Live data unavailable — showing scheduled times</p>
        </div>
      )}
    </div>
  )
}
