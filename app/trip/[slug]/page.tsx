import { getTripBySlug } from '@/lib/sheets'
import { notFound } from 'next/navigation'
import TripContent from '@/components/TripContent'

export const revalidate = Number(process.env.ISR_REVALIDATE_SECONDS) || 300

export default async function TripPage({
  params,
}: {
  params: { slug: string }
}) {
  const bundle = await getTripBySlug(params.slug)

  if (!bundle) {
    notFound()
  }

  return <TripContent bundle={bundle} />
}
