'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { TripBundle } from '@/lib/types'
import TripContent from '@/components/TripContent'
import { useSwipe } from '@/hooks/useSwipe'

export default function TripPage() {
  const params = useParams<{ slug: string }>()
  const [bundles, setBundles] = useState<TripBundle[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')

  useEffect(() => {
    fetch(`/api/trip/${params.slug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return [] }
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setBundles(data)
        else if (data && !data.error) setBundles([data])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.slug])

  const bundle = bundles[currentIndex]

  // Update branding when current trip changes
  useEffect(() => {
    if (!bundle) return
    const root = document.documentElement
    root.style.setProperty('--brand-primary', bundle.agency.primary_color)
    root.style.setProperty('--brand-secondary', bundle.agency.secondary_color)

    const fontFamily = bundle.agency.font || 'Inter'
    const existingLink = document.getElementById('agency-font')
    if (existingLink) existingLink.remove()
    const link = document.createElement('link')
    link.id = 'agency-font'
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`
    document.head.appendChild(link)
    document.body.style.fontFamily = `'${fontFamily}', sans-serif`

    document.title = `${bundle.trip.title} · ${bundle.agency.name}`
  }, [currentIndex, bundle])

  // Reset scroll on trip change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentIndex])

  const goNext = useCallback(() => {
    setSlideDirection('left')
    setCurrentIndex((i) => Math.min(i + 1, bundles.length - 1))
  }, [bundles.length])

  const goPrev = useCallback(() => {
    setSlideDirection('right')
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  const swipeHandlers = useSwipe(goNext, goPrev)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || bundles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold mb-4 text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Trip not found</h2>
          <p className="text-gray-500 mb-8">
            We couldn&apos;t find the trip you&apos;re looking for.
          </p>
          <a href="/" className="inline-block px-6 py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: 'var(--brand-primary)' }}>
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div {...swipeHandlers}>
      {/* Trip content with slide animation */}
      <div
        key={currentIndex}
        className={slideDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'}
      >
        <TripContent bundle={bundle} tripIndex={currentIndex} totalTrips={bundles.length} />
      </div>
    </div>
  )
}
