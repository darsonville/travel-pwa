import { getTripBySlug } from '@/lib/sheets'
import { notFound } from 'next/navigation'

export const revalidate = Number(process.env.ISR_REVALIDATE_SECONDS) || 300

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  // Verify at least one trip exists for this slug (server-side 404)
  const bundle = await getTripBySlug(params.slug)
  if (!bundle) {
    notFound()
  }

  // Inject initial branding from the first trip.
  // Client will dynamically update these when switching trips.
  const { agency, trip } = bundle
  const fontFamily = agency.font || 'Inter'
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root {
  --brand-primary: ${agency.primary_color};
  --brand-secondary: ${agency.secondary_color};
}
body { font-family: '${fontFamily}', sans-serif; }`,
        }}
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link id="agency-font" href={fontUrl} rel="stylesheet" />
      <title>{`${trip.title} · ${agency.name}`}</title>
      {children}
    </>
  )
}
