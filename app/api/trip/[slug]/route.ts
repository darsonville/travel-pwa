import { NextResponse } from 'next/server'
import { getTripBySlug } from '@/lib/sheets'

export const revalidate = Number(process.env.ISR_REVALIDATE_SECONDS) || 300

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const bundle = await getTripBySlug(params.slug)

  if (!bundle) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json(bundle)
}
