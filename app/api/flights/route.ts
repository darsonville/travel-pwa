import { NextRequest, NextResponse } from 'next/server'

/**
 * AviationStack flight proxy.
 *
 * Quota notes (free plan):
 * - 100 requests/month
 * - HTTP only (not HTTPS) — must be called server-side
 * - With revalidate: 600 (10 min), one flight polled continuously = ~144 req/day
 *   → upgrade to paid plan if trip count grows
 * - Consider revalidate: 1800 (30 min) for non-critical trips
 *
 * Smart caching:
 * - Flights whose date is >24h in the past are cached for 24h (landed flights don't change)
 * - Current/future flights are cached for 10 min
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const flightIata = searchParams.get('flight_iata')
  const flightDate = searchParams.get('flight_date')

  if (!flightIata || !flightDate) {
    return NextResponse.json(
      { error: 'Missing flight_iata or flight_date' },
      { status: 400 }
    )
  }

  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ live: null })
  }

  // Determine cache duration: past flights (>24h ago) get 24h cache
  const isPastFlight = new Date(flightDate).getTime() < Date.now() - 24 * 60 * 60 * 1000
  const cacheDuration = isPastFlight ? 86400 : 600

  try {
    // Free plan: HTTP only (not HTTPS), and flight_date filter is not available.
    // We query by flight_iata only — returns today's data for that flight number.
    const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(apiKey)}&flight_iata=${encodeURIComponent(flightIata)}`

    const res = await fetch(url, { next: { revalidate: cacheDuration } })

    if (!res.ok) {
      return NextResponse.json({ live: null })
    }

    const json = await res.json()

    if (!json.data || json.data.length === 0) {
      return NextResponse.json({ live: null })
    }

    // Free plan doesn't support flight_date filter, so we get back whatever
    // date the API has. Only use the data if it matches the requested date.
    const match = json.data.find(
      (f: { flight_date?: string }) => f.flight_date === flightDate
    )

    if (!match) {
      return NextResponse.json({ live: null })
    }

    return NextResponse.json(
      { live: match },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheDuration}`,
        },
      }
    )
  } catch {
    return NextResponse.json({ live: null })
  }
}
