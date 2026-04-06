'use client'

import { useState, useCallback, useRef } from 'react'
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api'
import type { Segment, POI } from '@/lib/types'

type TripMapProps = {
  segments: Segment[]
  pois: POI[]
  brandColor: string
}

const LIBRARIES: ('places')[] = ['places']

const MAP_CONTAINER = {
  width: '100%',
  height: '60vh',
  borderRadius: '1rem',
}

const POI_COLORS: Record<POI['category'], string> = {
  restaurant: '#EF4444',
  viewpoint: '#22C55E',
  shop: '#EAB308',
  tip: '#3B82F6',
  emergency: '#FFFFFF',
}

// Single-char labels for map markers (emojis don't render well on markers)
const POI_LABELS: Record<POI['category'], string> = {
  restaurant: 'R',
  viewpoint: 'V',
  shop: 'S',
  tip: 'T',
  emergency: '+',
}

const POI_CATEGORY_NAMES: Record<POI['category'], string> = {
  restaurant: 'Restaurant',
  viewpoint: 'Viewpoint',
  shop: 'Shop',
  tip: 'Tip',
  emergency: 'Emergency',
}

const SEGMENT_TYPE_NAMES: Record<string, string> = {
  transport: 'Transport',
  accommodation: 'Accommodation',
  activity: 'Activity',
  meal: 'Meal',
  transfer: 'Transfer',
}

type MarkerInfo =
  | { kind: 'segment'; data: Segment; dayLabel: string }
  | { kind: 'poi'; data: POI }

export default function TripMap({ segments, pois, brandColor }: TripMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  })

  const [selected, setSelected] = useState<MarkerInfo | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      const bounds = new google.maps.LatLngBounds()

      segments.forEach((s) => {
        bounds.extend({ lat: parseFloat(s.lat), lng: parseFloat(s.lng) })
      })
      pois.forEach((p) => {
        if (p.lat && p.lng) {
          bounds.extend({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) })
        }
      })

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 50)
      }
    },
    [segments, pois]
  )

  if (!isLoaded) {
    return (
      <div
        className="w-full rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center"
        style={{ height: '60vh' }}
      >
        <span className="text-gray-400 text-sm">Loading map...</span>
      </div>
    )
  }

  // Build a day-number lookup: segment_id -> day_number via day_id
  // We don't have days here, so we label by order in the list
  const segmentDayLabels = new Map<string, number>()
  segments.forEach((s, i) => {
    segmentDayLabels.set(s.segment_id, i + 1)
  })

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER}
      onLoad={onLoad}
      zoom={6}
      center={{ lat: 0, lng: 0 }}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Route markers — numbered blue circles */}
      {segments.map((seg, idx) => {
        const lat = parseFloat(seg.lat)
        const lng = parseFloat(seg.lng)
        if (isNaN(lat) || isNaN(lng)) return null

        return (
          <MarkerF
            key={`seg-${seg.segment_id}`}
            position={{ lat, lng }}
            label={{
              text: String(idx + 1),
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '11px',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: brandColor || '#1B4F72',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              labelOrigin: new google.maps.Point(0, 0),
            }}
            onClick={() =>
              setSelected({ kind: 'segment', data: seg, dayLabel: String(idx + 1) })
            }
            zIndex={10}
          />
        )
      })}

      {/* POI markers — color-coded by category */}
      {pois.map((poi) => {
        const lat = parseFloat(poi.lat)
        const lng = parseFloat(poi.lng)
        if (isNaN(lat) || isNaN(lng)) return null

        const color = POI_COLORS[poi.category] || '#6B7280'
        const isEmergency = poi.category === 'emergency'

        return (
          <MarkerF
            key={`poi-${poi.poi_id}`}
            position={{ lat, lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: isEmergency ? '#EF4444' : '#FFFFFF',
              strokeWeight: isEmergency ? 3 : 2,
              labelOrigin: new google.maps.Point(0, 0),
            }}
            label={{
              text: POI_LABELS[poi.category] || '?',
              color: isEmergency ? '#EF4444' : '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '11px',
            }}
            onClick={() => setSelected({ kind: 'poi', data: poi })}
            zIndex={5}
          />
        )
      })}

      {/* InfoWindow */}
      {selected && (
        <InfoWindowF
          position={{
            lat: parseFloat(
              selected.kind === 'segment' ? selected.data.lat : selected.data.lat
            ),
            lng: parseFloat(
              selected.kind === 'segment' ? selected.data.lng : selected.data.lng
            ),
          }}
          onCloseClick={() => setSelected(null)}
        >
          {selected.kind === 'segment' ? (
            <div className="max-w-[220px] text-sm">
              <p className="font-semibold">
                {selected.data.title}
              </p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                {SEGMENT_TYPE_NAMES[selected.data.type] || selected.data.type}
              </p>
              {selected.data.location_name && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {selected.data.location_name}
                </p>
              )}
              {selected.data.time && (
                <p className="text-gray-400 text-xs mt-0.5">
                  {selected.data.time}
                </p>
              )}
            </div>
          ) : (
            <div className="max-w-[220px] text-sm">
              <p className="font-semibold">
                {selected.data.name}
              </p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">
                {POI_CATEGORY_NAMES[selected.data.category]}
              </p>
              {selected.data.description && (
                <p className="text-gray-600 text-xs mt-1">
                  {selected.data.description}
                </p>
              )}
              {selected.data.url && (
                <a
                  href={selected.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs underline mt-1 inline-block"
                >
                  More info →
                </a>
              )}
            </div>
          )}
        </InfoWindowF>
      )}
    </GoogleMap>
  )
}
