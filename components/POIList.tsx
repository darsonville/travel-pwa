'use client'

import type { ReactNode } from 'react'
import type { POI } from '@/lib/types'
import {
  RestaurantIcon, ViewpointIcon, ShopIcon, TipIcon, EmergencyIcon,
} from './Icons'

const POI_ICONS: Record<POI['category'], ReactNode> = {
  restaurant: <RestaurantIcon className="w-4 h-4" />,
  viewpoint: <ViewpointIcon className="w-4 h-4" />,
  shop: <ShopIcon className="w-4 h-4" />,
  tip: <TipIcon className="w-4 h-4" />,
  emergency: <EmergencyIcon className="w-4 h-4" />,
}

const CATEGORY_LABELS: Record<POI['category'], string> = {
  emergency: 'Emergency',
  restaurant: 'Restaurants',
  viewpoint: 'Viewpoints',
  shop: 'Shops',
  tip: 'Tips',
}

const CATEGORY_ORDER: POI['category'][] = [
  'emergency',
  'restaurant',
  'viewpoint',
  'shop',
  'tip',
]

export default function POIList({ pois }: { pois: POI[] }) {
  if (pois.length === 0) return null

  const grouped = new Map<POI['category'], POI[]>()
  for (const poi of pois) {
    const list = grouped.get(poi.category) || []
    list.push(poi)
    grouped.set(poi.category, list)
  }

  return (
    <div className="mt-6 space-y-6">
      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((category) => {
        const items = grouped.get(category)!
        const isEmergency = category === 'emergency'

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span className="text-gray-400">{POI_ICONS[category]}</span>
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="space-y-2">
              {items.map((poi) => (
                <div
                  key={poi.poi_id}
                  className={`bg-white rounded-xl p-4 shadow-sm flex gap-3 items-start ${
                    isEmergency ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  {poi.photo_url && (
                    <img
                      src={poi.photo_url}
                      alt={poi.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{poi.name}</p>
                    {poi.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {poi.description}
                      </p>
                    )}
                  </div>
                  {poi.url && (
                    <a
                      href={poi.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-white"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Visit
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
