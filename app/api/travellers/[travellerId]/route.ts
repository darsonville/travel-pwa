import { NextRequest, NextResponse } from 'next/server'
import { readSheet, rowsToObjects, updateRowById, deleteRowById } from '@/lib/sheets'
import type { Traveller } from '@/lib/types'

const SHEET = 'travellers'

const COLUMNS: (keyof Traveller)[] = [
  'traveller_id', 'trip_id', 'name', 'surname', 'date_of_birth',
  'citizenship', 'document_type', 'document_number', 'document_expiry',
  'document_image_url', 'notes',
]

export async function PUT(
  request: NextRequest,
  { params }: { params: { travellerId: string } }
) {
  try {
    const { travellerId } = params
    const body = await request.json()

    // Read existing row to merge partial updates
    const rows = await readSheet(SHEET)
    const all = rowsToObjects<Traveller>(rows)
    const existing = all.find((t) => t.traveller_id === travellerId)
    if (!existing) {
      return NextResponse.json({ error: 'Traveller not found' }, { status: 404 })
    }

    const updated: Traveller = { ...existing, ...body, traveller_id: travellerId }
    const values = COLUMNS.map((col) => updated[col])
    await updateRowById(SHEET, travellerId, values)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/travellers error:', error)
    return NextResponse.json({ error: 'Failed to update traveller' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { travellerId: string } }
) {
  try {
    await deleteRowById(SHEET, params.travellerId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/travellers error:', error)
    return NextResponse.json({ error: 'Failed to delete traveller' }, { status: 500 })
  }
}
