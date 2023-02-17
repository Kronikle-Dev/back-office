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
  organization: string,
}