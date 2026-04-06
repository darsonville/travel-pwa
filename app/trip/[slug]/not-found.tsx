import Link from 'next/link'

export default function TripNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-2">Trip not found</h2>
        <p className="text-gray-500 mb-8">
          We couldn&apos;t find the trip you&apos;re looking for. Please check your trip code and try again.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg text-white font-semibold transition-colors"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
