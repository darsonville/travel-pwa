import { NextRequest, NextResponse } from 'next/server'
import { readSheet, rowsToObjects, appendRow } from '@/lib/sheets'
import type { Traveller } from '@/lib/types'

const SHEET = 'travellers'

const COLUMNS: (keyof Traveller)[] = [
  'traveller_id', 'trip_id', 'name', 'surname', 'date_of_birth',
  'citizenship', 'document_type', 'document_number', 'document_expiry',
  'document_image_url', 'notes',
]

export async function GET(request: NextRequest) {
  const tripId = request.nextUrl.searchParams.get('trip_id')
  if (!tripId) {
    return NextResponse.json({ error: 'Missing trip_id' }, { status: 400 })
  }

  try {
    const rows = await readSheet(SHEET)
    const all = rowsToObjects<Traveller>(rows)
    const filtered = all.filter((t) => t.trip_id === tripId)
    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('GET /api/travellers error:', error)
    return NextResponse.json({ error: 'Failed to fetch travellers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const travellerId = `tvl_${Date.now()}`

    const traveller: Traveller = {
      traveller_id: travellerId,
      trip_id: body.trip_id || '',
      name: body.name || '',
      surname: body.surname || '',
      date_of_birth: body.date_of_birth || '',
      citizenship: body.citizenship || '',
      document_type: body.document_type || 'passport',
      document_number: body.document_number || '',
      document_expiry: body.document_expiry || '',
      document_image_url: body.document_image_url || '',
      notes: body.notes || '',
    }

    const values = COLUMNS.map((col) => traveller[col])
    await appendRow(SHEET, values)

    return NextResponse.json(traveller, { status: 201 })
  } catch (error) {
    console.error('POST /api/travellers error:', error)
    return NextResponse.json({ error: 'Failed to create traveller' }, { status: 500 })
  }
}
