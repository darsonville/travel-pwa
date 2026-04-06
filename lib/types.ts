export type Agency = {
  agency_id: string
  name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  font: string
  crisp_website_id: string
  whatsapp_number: string
  email: string
}

export type Trip = {
  trip_id: string
  slug: string
  agency_id: string
  traveler_name: string
  title: string
  start_date: string
  end_date: string
  status: 'quote' | 'booked'
  cover_image_url: string
  description: string
  language_default: string
  active: string
}

export type Day = {
  day_id: string
  trip_id: string
  day_number: string
  date: string
  title: string
  description: string
  destination_city: string
  destination_country: string
}

export type Segment = {
  segment_id: string
  day_id: string
  order: string
  type: 'transport' | 'accommodation' | 'activity' | 'meal' | 'transfer'
  time: string
  title: string
  description: string
  location_name: string
  lat: string
  lng: string
  photo_urls: string
  duration_minutes: string
  notes: string
}

export type POI = {
  poi_id: string
  trip_id: string
  name: string
  category: 'restaurant' | 'viewpoint' | 'shop' | 'tip' | 'emergency'
  lat: string
  lng: string
  description: string
  photo_url: string
  url: string
}

export type Document = {
  doc_id: string
  trip_id: string
  name: string
  type: 'voucher' | 'insurance' | 'ticket' | 'visa' | 'other'
  url: string
  order: string
}

export type Flight = {
  flight_id: string
  trip_id: string
  flight_number: string
  date: string
  origin_iata: string
  destination_iata: string
  departure_time: string
  arrival_time: string
  notes: string
}

export type Traveller = {
  traveller_id: string
  trip_id: string
  name: string
  surname: string
  date_of_birth: string
  citizenship: string
  document_type: 'passport' | 'national_id' | 'other'
  document_number: string
  document_expiry: string
  document_image_url: string
  notes: string
}

export type TripBundle = {
  agency: Agency
  trip: Trip
  days: Day[]
  segments: Segment[]
  pois: POI[]
  documents: Document[]
  flights: Flight[]
}
