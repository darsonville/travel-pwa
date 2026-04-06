'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [tripCode, setTripCode] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tripCode.trim()) {
      router.push(`/trip/${tripCode.trim()}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
            My Trip
          </h1>
          <p className="text-gray-500">Access your personalized travel itinerary</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={tripCode}
            onChange={(e) => setTripCode(e.target.value)}
            placeholder="Enter your trip code"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] text-center text-lg"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-semibold text-lg transition-colors"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            View My Trip
          </button>
        </form>
      </div>
    </div>
  )
}
