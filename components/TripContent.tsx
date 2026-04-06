'use client'

import { useState } from 'react'
import type { TripBundle } from '@/lib/types'
import DayCard from './DayCard'
import TripMap from './TripMap'
import POIList from './POIList'
import FlightCard from './FlightCard'
import TravellersList from './TravellersList'
import {
  VoucherIcon, ShieldIcon, TicketIcon, DocumentIcon, PaperclipIcon,
  PlaneIcon, LinkIcon, PrinterIcon,
} from './Icons'
import PrintView from './PrintView'

const TABS = ['Itinerary', 'Map', 'Documents', 'Flights', 'Travellers'] as const
type Tab = typeof TABS[number]

type Props = {
  bundle: TripBundle
  tripIndex?: number
  totalTrips?: number
}

export default function TripContent({ bundle, tripIndex, totalTrips }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Itinerary')
  const [showPrintView, setShowPrintView] = useState(false)
  const { agency, trip, days, segments, pois, documents, flights } = bundle

  const sortedDays = [...days].sort(
    (a, b) => Number(a.day_number) - Number(b.day_number)
  )

  const segmentsByDay = (dayId: string) =>
    segments
      .filter((s) => s.day_id === dayId)
      .sort((a, b) => Number(a.order) - Number(b.order))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {trip.cover_image_url && (
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Agency Logo */}
        {agency.logo_url && (
          <img
            src={agency.logo_url}
            alt={agency.name}
            className="absolute top-4 left-4 h-10 sm:h-12 object-contain drop-shadow-lg"
          />
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
              trip.status === 'booked'
                ? 'bg-green-500 text-white'
                : 'bg-yellow-400 text-yellow-900'
            }`}
          >
            {trip.status}
          </span>
        </div>

        {/* Hero Text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <p className="text-sm opacity-90 mb-1">
            Hello, {trip.traveler_name}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">{trip.title}</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-90">
              {trip.start_date} &mdash; {trip.end_date}
            </p>
            {totalTrips && totalTrips > 1 && tripIndex !== undefined && (
              <span className="text-sm opacity-75 font-medium">
                {tripIndex + 1}/{totalTrips}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                activeTab === tab
                  ? 'border-b-2 text-[var(--brand-primary)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={
                activeTab === tab
                  ? { borderBottomColor: 'var(--brand-primary)' }
                  : undefined
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'Itinerary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div />
              <button
                onClick={() => setShowPrintView(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Printable version"
              >
                <PrinterIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {trip.description && (
              <p className="text-gray-600 mb-6">{trip.description}</p>
            )}
            {sortedDays.map((day) => (
              <DayCard
                key={day.day_id}
                day={day}
                segments={segmentsByDay(day.day_id)}
              />
            ))}
          </div>
        )}

        {activeTab === 'Map' && (
          <div>
            <TripMap
              segments={segments.filter((s) => s.lat && s.lng)}
              pois={pois}
              brandColor={agency.primary_color}
            />
            <POIList pois={pois} />
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="space-y-3">
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No documents available</p>
            ) : (
              [...documents]
                .sort((a, b) => Number(a.order) - Number(b.order))
                .map((doc) => (
                  <a
                    key={doc.doc_id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="text-gray-500">
                      {doc.type === 'voucher' && <VoucherIcon className="w-6 h-6" />}
                      {doc.type === 'insurance' && <ShieldIcon className="w-6 h-6" />}
                      {doc.type === 'ticket' && <TicketIcon className="w-6 h-6" />}
                      {doc.type === 'visa' && <DocumentIcon className="w-6 h-6" />}
                      {doc.type === 'other' && <PaperclipIcon className="w-6 h-6" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 uppercase">{doc.type}</p>
                    </div>
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                  </a>
                ))
            )}
          </div>
        )}

        {activeTab === 'Flights' && (
          <div className="space-y-4">
            {flights.length === 0 ? (
              <div className="text-center py-12">
                <PlaneIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No flights added to this trip yet.</p>
              </div>
            ) : (
              [...flights]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((flight) => (
                  <FlightCard key={flight.flight_id} flight={flight} />
                ))
            )}
          </div>
        )}

        {activeTab === 'Travellers' && (
          <TravellersList tripId={trip.trip_id} />
        )}
      </div>

      {showPrintView && (
        <PrintView bundle={bundle} onClose={() => setShowPrintView(false)} />
      )}
    </div>
  )
}
