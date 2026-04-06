'use client'

import { useState, type ReactNode } from 'react'
import type { Day, Segment } from '@/lib/types'
import {
  PlaneIcon, HotelIcon, ActivityIcon, MealIcon, BusIcon,
  MapPinIcon, TimerIcon, TipIcon,
} from './Icons'

const SEGMENT_ICONS: Record<string, ReactNode> = {
  transport: <PlaneIcon className="w-5 h-5" />,
  accommodation: <HotelIcon className="w-5 h-5" />,
  activity: <ActivityIcon className="w-5 h-5" />,
  meal: <MealIcon className="w-5 h-5" />,
  transfer: <BusIcon className="w-5 h-5" />,
}

export default function DayCard({
  day,
  segments,
}: {
  day: Day
  segments: Segment[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
      >
        {/* Day Number Badge */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          <span className="text-[10px] uppercase leading-none">Day</span>
          <span className="text-lg leading-none">{day.day_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{day.title}</h3>
          <p className="text-xs text-gray-500">
            {day.date} &middot; {day.destination_city}, {day.destination_country}
          </p>
          {day.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {day.description}
            </p>
          )}
        </div>

        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && segments.length > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4">
          {segments.map((segment) => (
            <div key={segment.segment_id} className="mt-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 text-gray-500 mt-0.5">
                  {SEGMENT_ICONS[segment.type] || <MapPinIcon className="w-5 h-5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    {segment.time && (
                      <span className="text-xs font-medium text-gray-400">
                        {segment.time}
                      </span>
                    )}
                    <h4 className="font-medium text-sm">{segment.title}</h4>
                  </div>
                  {segment.location_name && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" /> {segment.location_name}
                    </p>
                  )}
                  {segment.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {segment.description}
                    </p>
                  )}
                  {segment.duration_minutes && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <TimerIcon className="w-3 h-3" /> {segment.duration_minutes} min
                    </p>
                  )}

                  {/* Photo Gallery */}
                  {segment.photo_urls && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {segment.photo_urls.split(',').map((url, i) => (
                        <img
                          key={i}
                          src={url.trim()}
                          alt={`${segment.title} photo ${i + 1}`}
                          className="h-24 w-32 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Notes Callout */}
                  {segment.notes && (
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 flex items-start gap-2">
                      <TipIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                      <span>{segment.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && segments.length === 0 && (
        <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-400">
          No activities planned for this day
        </div>
      )}
    </div>
  )
}
