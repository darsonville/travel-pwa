import { google } from 'googleapis'
import type { Agency, Trip, Day, Segment, POI, Document, Flight, TripBundle } from './types'
import { rewriteDriveUrl, rewriteDriveUrls } from './drive'

const TABS = ['agencies', 'trips', 'days', 'segments', 'pois', 'documents', 'flights'] as const

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

function getSpreadsheetId() {
  return process.env.GOOGLE_SPREADSHEET_ID!
}

export function rowsToObjects<T>(rows: string[][]): T[] {
  if (!rows || rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((header, i) => {
      obj[header] = row[i] || ''
    })
    return obj as T
  })
}

// --- Read helpers ---

export async function readSheet(sheetName: string): Promise<string[][]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:Z`,
  })
  return (res.data.values as string[][]) || []
}

// --- Write helpers ---

export async function appendRow(sheetName: string, values: string[]): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  })
}

export async function updateRowById(sheetName: string, id: string, values: string[]): Promise<void> {
  const sheets = getSheetsClient()
  const rows = await readSheet(sheetName)
  // Row 0 is header, data starts at row 1 → sheet row 2
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id)
  if (rowIndex === -1) throw new Error(`Row with id ${id} not found in ${sheetName}`)

  const sheetRow = rowIndex + 1 // 1-indexed in Sheets
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheetName}!A${sheetRow}:${String.fromCharCode(64 + values.length)}${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

export async function deleteRowById(sheetName: string, id: string): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  // Get the sheet's numeric ID (gid)
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const sheetMeta = meta.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  )
  if (!sheetMeta?.properties?.sheetId && sheetMeta?.properties?.sheetId !== 0) {
    throw new Error(`Sheet ${sheetName} not found`)
  }
  const sheetId = sheetMeta.properties.sheetId

  // Find the row index
  const rows = await readSheet(sheetName)
  const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id)
  if (rowIndex === -1) throw new Error(`Row with id ${id} not found in ${sheetName}`)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  })
}

// --- Trip bundle (read-only, original logic) ---

export async function getTripBySlug(slug: string): Promise<TripBundle | null> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSpreadsheetId()
  const ranges = TABS.map((tab) => `${tab}!A:Z`)

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
  })

  const valueRanges = response.data.valueRanges || []

  const agencies = rowsToObjects<Agency>(valueRanges[0]?.values as string[][] || [])
  const trips = rowsToObjects<Trip>(valueRanges[1]?.values as string[][] || [])
  const days = rowsToObjects<Day>(valueRanges[2]?.values as string[][] || [])
  const segments = rowsToObjects<Segment>(valueRanges[3]?.values as string[][] || [])
  const pois = rowsToObjects<POI>(valueRanges[4]?.values as string[][] || [])
  const documents = rowsToObjects<Document>(valueRanges[5]?.values as string[][] || [])
  const flights = rowsToObjects<Flight>(valueRanges[6]?.values as string[][] || [])

  const trip = trips.find((t) => t.slug === slug)
  if (!trip || trip.active !== 'TRUE') return null

  const agency = agencies.find((a) => a.agency_id === trip.agency_id)
  if (!agency) return null

  const tripDays = days.filter((d) => d.trip_id === trip.trip_id)
  const dayIds = new Set(tripDays.map((d) => d.day_id))

  const tripSegments = segments.filter((s) => dayIds.has(s.day_id))
  const tripPois = pois.filter((p) => p.trip_id === trip.trip_id)
  const tripDocuments = documents.filter((d) => d.trip_id === trip.trip_id)
  const tripFlights = flights.filter((f) => f.trip_id === trip.trip_id)

  // Rewrite Google Drive URLs to proxy through /api/drive/[fileId]
  agency.logo_url = rewriteDriveUrl(agency.logo_url)
  trip.cover_image_url = rewriteDriveUrl(trip.cover_image_url)

  for (const seg of tripSegments) {
    seg.photo_urls = rewriteDriveUrls(seg.photo_urls)
  }

  for (const poi of tripPois) {
    poi.photo_url = rewriteDriveUrl(poi.photo_url)
  }

  return {
    agency,
    trip,
    days: tripDays,
    segments: tripSegments,
    pois: tripPois,
    documents: tripDocuments,
    flights: tripFlights,
  }
}
