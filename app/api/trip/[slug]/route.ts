import { NextResponse } from 'next/server'
import { getTripsBundlesBySlug } from '@/lib/sheets'

export const revalidate = Number(process.env.ISR_REVALIDATE_SECONDS) || 300

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const bundles = await getTripsBundlesBySlug(params.slug)

  if (bundles.length === 0) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json(bundles)
}
