import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Trip',
  description: 'Your personalized travel itinerary',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1B4F72',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
