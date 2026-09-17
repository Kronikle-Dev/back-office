interface ThirdPartyEvent {
    name: string,
    id: string,
    description: string,
    date: Array<Date>
}

interface KDate {
  $id?: string,
  eventId: string,
  startDateTime: Date,
  endDateTime: Date,
  placeName: string,
  placeDescription: string,
  maxAttendeeCapacity: Number | null,
  attendanceMode: string,
  mandatoryRegistration: boolean,
  accessibility: string,
  new?: boolean,
  status?: 'valid' | 'updated' | 'canceled' ,
}

interface KDateApi extends KDate {
  startDateTime: string, // ISO Date string
  endDateTime: string, // ISO Date string
}

interface KDateApiAug extends KDateApi {
  event: KEvent | null
}

// Lieu réutilisable d'une organisation (collection `place`). Le lieu d'une séance
// reste dénormalisé sur le document `date` : renommer un lieu ne propage rien.
interface KPlace {
  $id?: string,
  name: string,
  description: string,
  author: string, // id de la Team (organisation)
}

interface KEvent {
  name: string,
  description: string,
  creationDate: Date,
  updateDate: Date,
  status: 'published' | 'draft' | 'cancelled' | 'archived' | 'rescheduled' | 'imported',
  author: string,
  originId?: string,
  imageId?: string,
  imageUrl?: string,
  minAge: Number | null,
  maxAge: Number | null,
  price: Number | null,
  url: string | null,
  tags?: Array<string>,
  publicTypes?: Array<string>,
  eventType?: Array<string>,
  organization?: string,
  $id?: string
}

interface KImportEvent {
  event: KEvent | null,
  dates: Array<KDate>,
  tags: Array<string>,
  publicTypes: Array<string>,
  eventTypes: Array<string>,
  error?: string,
}

enum KResourceType {
  url = 'url',
  file= 'file',
  book= 'book',
  text= 'text',
  video='video',
  sound='sound',
  cddvd='cddvd',
  externalwidget= 'externalwidget'
}

interface KResource {
  $id?: string,
  eventId: string,
  resourceType: KResourceType,
  url?: string,
  name: string,
  description?: string,
  organization: string,
  isOwnResource: boolean,
  imageUrl?: string,
  imageAlt?: string,
  author: string,
  tags: string[],
  html?: string
}

interface KDisplay {
  $id: string,
  name: string,
  template: string,
  events: string[],
  eventFilter: string,
  publicFilter: string[],
  typeFilter: string[],
  tagFilter: string[],
  excludeFilters: boolean,
  organization: string,
  logoId: string,
  logoUrl: string,
  maxEventAgeMonths?: number | null, // null/absent/0 = pas de péremption des séances
}

// Statistiques d'usage d'un affichage (collection `display-usage`, cf. composables/useDisplayTracking.ts)
interface KDisplayUsage {
  $id?: string,
  $createdAt?: string,
  kind: 'visit' | 'session',
  displayId: string,
  source: 'direct' | 'qr',
  visitorId: string,
  path?: string,
  // Champs propres aux sessions d'interaction
  startedAt?: string,
  endedAt?: string,
  durationSeconds?: number,
  interactions?: number,
  clicks?: number,
  scrolls?: number,
  keys?: number,
  pageViews?: number,
}

// --- Import iCalendar (cf. server/utils/ical.ts) ---

interface IcalPreviewEvent {
  uid: string,
  originId: string,
  name: string,
  firstStart: string, // ISO
  lastEnd: string, // ISO
  occurrences: number,
  recurring: boolean,
  past: boolean,
  location: string,
  import: KImportEvent,
}

interface IcalPreviewResponse {
  error?: string, // code d'erreur traduit côté client (event.import.ical.errors.<code>)
  calendarName?: string,
  truncated?: boolean,
  events: IcalPreviewEvent[],
}
