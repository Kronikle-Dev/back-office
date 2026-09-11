// @ts-ignore - `node:crypto` n'est pas typé dans le tsconfig applicatif (types Node absents)
import { createHash } from 'node:crypto'
import ICAL from 'ical.js'
import { DateTime, IANAZone } from 'luxon'
import { NodeHtmlMarkdown } from 'node-html-markdown'

// Bornes de sécurité : Netlify coupe les fonctions à 10 s, on reste en dessous.
export const ICAL_MAX_BYTES = 5 * 1024 * 1024
export const ICAL_TIMEOUT_MS = 8000
export const ICAL_MAX_EVENTS = 500
export const ICAL_MAX_OCCURRENCES = 100
export const ICAL_MAX_ITERATIONS = 5000
export const ICAL_DEFAULT_ZONE = 'Europe/Paris'

const NAME_MAX = 200
const DESCRIPTION_MAX = 3000
const PLACE_DESCRIPTION_MAX = 500
// `event.originId` fait 100 caractères : au-delà de 95, le préfixe `ical:` déborde.
const UID_MAX = 95

/** Hôtes interdits : on ne laisse pas la route serveur scanner le réseau interne. */
function isPrivateHost (hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  if (host === '::1' || host === '0.0.0.0' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
    return true
  }
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }
  return false
}

/** `webcal(s)://` → `https://`, et refus de tout ce qui n'est pas http(s) public. */
export function normalizeIcalUrl (raw: string | undefined | null): { url: string } | { error: string } {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { error: 'missing-url' }
  const replaced = trimmed.replace(/^webcals?:\/\//i, 'https://')
  let parsed: URL
  try {
    parsed = new URL(replaced)
  } catch {
    return { error: 'invalid-url' }
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return { error: 'invalid-url' }
  if (isPrivateHost(parsed.hostname)) return { error: 'invalid-url' }
  return { url: parsed.toString() }
}

/** Télécharge l'ICS en contrôlant durée, taille et nature du contenu. */
export async function fetchIcs (url: string): Promise<{ ics: string } | { error: string }> {
  let response: Response
  try {
    response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(ICAL_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Kronikle/1.0',
        Accept: 'text/calendar, text/plain;q=0.8, */*;q=0.5',
      },
    })
  } catch (e: any) {
    return { error: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'timeout' : 'fetch-failed' }
  }
  if (!response.ok) return { error: 'fetch-failed' }

  const declaredLength = Number(response.headers.get('content-length') ?? '0')
  if (declaredLength > ICAL_MAX_BYTES) return { error: 'too-large' }

  let body: string
  try {
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > ICAL_MAX_BYTES) return { error: 'too-large' }
    body = new TextDecoder('utf-8').decode(buffer)
  } catch {
    return { error: 'fetch-failed' }
  }

  const ics = body.replace(/^﻿/, '').trimStart()
  if (!ics.startsWith('BEGIN:VCALENDAR')) return { error: 'not-ical' }
  return { ics }
}

/** `originId` namespacé, haché si l'UID dépasse la taille de l'attribut Appwrite. */
export function makeOriginId (uid: string): string {
  if (uid.length <= UID_MAX) return `ical:${uid}`
  return `ical:${createHash('sha256').update(uid).digest('hex').slice(0, 40)}`
}

function truncate (value: string, max: number): string {
  const trimmed = value.trim()
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

/**
 * L'attribut `url` d'Appwrite valide le schéma : une propriété URL iCalendar
 * exotique (`message:`, `mailto:`, `x-apple-…`) y déclenche une 400. On ne garde
 * donc que les liens http(s), les seuls exploitables dans l'interface.
 */
function httpUrlOrNull (value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null
  } catch {
    return null
  }
}

function validZone (zone: string | undefined | null): string | null {
  if (!zone) return null
  return IANAZone.isValidZone(zone) ? zone : null
}

function firstString (component: any, prop: string): string {
  const value = component.getFirstPropertyValue(prop)
  if (typeof value === 'string') return value
  if (value && typeof value.toString === 'function') return String(value)
  return ''
}

/** TZID porté par la propriété (les VTIMEZONE ne sont pas enregistrés : état global). */
function tzidOf (component: any, prop: string): string | null {
  const property = component.getFirstProperty(prop)
  if (!property) return null
  const tzid = property.getParameter('tzid')
  return typeof tzid === 'string' ? tzid : null
}

/**
 * `ICAL.Time` → `Date`. UTC : conversion directe. Sinon on recompose l'instant
 * avec luxon dans le fuseau le plus plausible (TZID, puis X-WR-TIMEZONE, puis Paris).
 */
export function icalTimeToDate (time: any, tzid: string | null, fallbackZone: string): Date {
  const zoneId = time?.zone?.tzid
  if (zoneId === 'Z' || zoneId === 'UTC') return time.toJSDate()
  const zone = validZone(tzid) ?? validZone(zoneId) ?? fallbackZone
  const built = DateTime.fromObject({
    year: time.year,
    month: time.month,
    day: time.day,
    hour: time.isDate ? 0 : time.hour,
    minute: time.isDate ? 0 : time.minute,
    second: time.isDate ? 0 : time.second,
  }, { zone })
  return built.isValid ? built.toJSDate() : time.toJSDate()
}

/** DESCRIPTION en Markdown, en privilégiant la variante HTML des exports Outlook. */
export function descriptionToMarkdown (component: any): string {
  const altProperty = component.getAllProperties('x-alt-desc')
    .find((p: any) => String(p.getParameter('fmttype') ?? '').toLowerCase() === 'text/html')
  if (altProperty) {
    const html = String(altProperty.getFirstValue() ?? '')
    if (html) return truncate(NodeHtmlMarkdown.translate(html, {}, undefined, undefined), DESCRIPTION_MAX)
  }
  const raw = firstString(component, 'description')
  if (!raw) return ''
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return truncate(NodeHtmlMarkdown.translate(raw, {}, undefined, undefined), DESCRIPTION_MAX)
  }
  return truncate(raw, DESCRIPTION_MAX)
}

/**
 * LOCATION → lieu + mode de participation. Une URL seule signale un événement
 * en ligne, un lien de visio joint à une adresse physique un événement mixte.
 */
export function locationToPlace (location: string, hasConference: boolean, eventUrl: string | null): {
  placeName: string, placeDescription: string, attendanceMode: string, url: string | null,
} {
  const value = (location ?? '').trim()
  const isUrl = /^https?:\/\/\S+$/i.test(value)
  if (isUrl) {
    return {
      placeName: '',
      placeDescription: '',
      attendanceMode: 'online',
      url: eventUrl || value,
    }
  }
  if (!value) {
    // `attendanceMode` est un enum (online/offline/mixed) : pas de valeur vide.
    // Sans lieu ni visio, on retient le défaut de l'assistant (cf. New2.vue).
    return {
      placeName: '',
      placeDescription: '',
      attendanceMode: hasConference ? 'online' : 'offline',
      url: eventUrl,
    }
  }
  return {
    placeName: truncate(value, NAME_MAX),
    placeDescription: value.length > NAME_MAX ? truncate(value, PLACE_DESCRIPTION_MAX) : '',
    attendanceMode: hasConference ? 'mixed' : 'offline',
    url: eventUrl,
  }
}

function isCancelled (component: any): boolean {
  return firstString(component, 'status').toUpperCase() === 'CANCELLED'
}

function categoriesOf (component: any): string[] {
  const names: string[] = []
  for (const property of component.getAllProperties('categories')) {
    for (const value of property.getValues()) {
      const name = String(value ?? '').trim()
      if (name && !names.includes(name)) names.push(name)
    }
  }
  return names
}

/** Une occurrence (main ou override) → un `KDate`. */
function buildDate (item: any, startTime: any, endTime: any, fallbackZone: string, eventUrl: string | null): KDate {
  const component = item.component
  const tzid = tzidOf(component, 'dtstart')
  const endTzid = tzidOf(component, 'dtend') ?? tzid
  const allDay = Boolean(startTime?.isDate)

  let start = icalTimeToDate(startTime, tzid, fallbackZone)
  let end = icalTimeToDate(endTime, endTzid, fallbackZone)

  if (allDay) {
    // Une date sans heure est flottante : ni TZID ni X-WR-TIMEZONE ne la qualifient,
    // on l'ancre donc sur le fuseau de l'application pour obtenir bien 00:00 → 23:59.
    // DTEND est exclusif : la dernière journée réellement occupée est la veille.
    const zone = ICAL_DEFAULT_ZONE
    const firstDay = DateTime.fromObject({ year: startTime.year, month: startTime.month, day: startTime.day }, { zone })
    const lastDay = DateTime.fromObject({ year: endTime.year, month: endTime.month, day: endTime.day }, { zone }).minus({ days: 1 })
    start = firstDay.toJSDate()
    end = (lastDay < firstDay ? firstDay : lastDay).set({ hour: 23, minute: 59 }).toJSDate()
  } else if (end.getTime() <= start.getTime()) {
    // Ni DTEND ni DURATION exploitables : on donne une heure à la séance.
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  const location = locationToPlace(firstString(component, 'location'), hasConference(component), eventUrl)

  return {
    eventId: '',
    startDateTime: start,
    endDateTime: end,
    placeName: location.placeName,
    placeDescription: location.placeDescription,
    maxAttendeeCapacity: null,
    attendanceMode: location.attendanceMode,
    mandatoryRegistration: false,
    accessibility: '',
    status: 'valid',
  }
}

function hasConference (component: any): boolean {
  return Boolean(component.getFirstProperty('conference') || component.getFirstProperty('x-google-conference'))
}

/** Expanse une série récurrente dans la fenêtre demandée. */
function expandOccurrences (event: any, windowStart: Date, windowEnd: Date, fallbackZone: string, eventUrl: string | null): KDate[] {
  const dates: KDate[] = []
  const iterator = event.iterator()
  let iterations = 0
  let next = iterator.next()
  while (next && iterations < ICAL_MAX_ITERATIONS && dates.length < ICAL_MAX_OCCURRENCES) {
    iterations += 1
    let details: any = null
    try {
      details = event.getOccurrenceDetails(next)
    } catch {
      details = null
    }
    if (details) {
      const start = icalTimeToDate(details.startDate, tzidOf(details.item.component, 'dtstart'), fallbackZone)
      if (start.getTime() > windowEnd.getTime()) break
      if (start.getTime() >= windowStart.getTime() && !isCancelled(details.item.component)) {
        dates.push(buildDate(details.item, details.startDate, details.endDate, fallbackZone, eventUrl))
      }
    }
    next = iterator.next()
  }
  return dates
}

/** Parse un ICS complet en liste d'événements importables. */
export function parseIcsToPreview (ics: string, options: { includePast: boolean, now?: Date }): IcalPreviewResponse {
  const now = options.now ?? new Date()
  const windowStart = DateTime.fromJSDate(now).minus({ months: 1 }).toJSDate()
  const windowEnd = DateTime.fromJSDate(now).plus({ months: 12 }).toJSDate()
  const pastCutoff = windowStart

  let calendar: any
  try {
    calendar = new ICAL.Component(ICAL.parse(ics))
  } catch {
    return { error: 'invalid-ical', events: [] }
  }

  const calendarName = firstString(calendar, 'x-wr-calname') || undefined
  const fallbackZone = validZone(firstString(calendar, 'x-wr-timezone')) ?? ICAL_DEFAULT_ZONE

  const vevents = calendar.getAllSubcomponents('vevent')

  // Regroupement par UID : le composant sans RECURRENCE-ID porte la série,
  // les autres en sont les exceptions.
  const groups = new Map<string, { main: any | null, exceptions: any[] }>()
  for (const vevent of vevents) {
    const uid = firstString(vevent, 'uid')
    if (!uid) continue
    let group = groups.get(uid)
    if (!group) {
      group = { main: null, exceptions: [] }
      groups.set(uid, group)
    }
    if (vevent.getFirstProperty('recurrence-id')) {
      group.exceptions.push(vevent)
    } else if (!group.main) {
      group.main = vevent
    } else {
      group.exceptions.push(vevent)
    }
  }

  const previews: IcalPreviewEvent[] = []

  for (const [uid, group] of groups) {
    // Override orphelin (UID sans composant principal) : chacun devient autonome.
    const roots = group.main ? [{ component: group.main, exceptions: group.exceptions }] : group.exceptions.map(c => ({ component: c, exceptions: [] as any[] }))

    for (const root of roots) {
      if (isCancelled(root.component)) continue

      let icalEvent: any
      try {
        icalEvent = new ICAL.Event(root.component, { exceptions: root.exceptions })
      } catch {
        continue
      }

      const eventUrl = httpUrlOrNull(firstString(root.component, 'url'))
      const recurring = icalEvent.isRecurring()

      let dates: KDate[] = []
      if (recurring) {
        dates = expandOccurrences(icalEvent, windowStart, windowEnd, fallbackZone, eventUrl)
      } else {
        const start = icalEvent.startDate
        const end = icalEvent.endDate ?? start
        if (start) dates = [buildDate(icalEvent, start, end, fallbackZone, eventUrl)]
      }
      if (dates.length === 0) continue

      dates.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
      const firstStart = dates[0]!.startDateTime
      const lastEnd = dates[dates.length - 1]!.endDateTime

      // Les séries sont bornées à la fenêtre : seuls les événements simples
      // anciens sont masqués par défaut.
      if (!options.includePast && !recurring && lastEnd.getTime() < pastCutoff.getTime()) continue

      const location = dates[0]!.placeName || firstString(root.component, 'location')
      const summary = truncate(firstString(root.component, 'summary'), NAME_MAX) || 'Sans titre'
      const place = locationToPlace(firstString(root.component, 'location'), hasConference(root.component), eventUrl)

      previews.push({
        uid,
        originId: makeOriginId(uid),
        name: summary,
        firstStart: firstStart.toISOString(),
        lastEnd: lastEnd.toISOString(),
        occurrences: dates.length,
        recurring,
        past: lastEnd.getTime() < now.getTime(),
        location,
        import: {
          event: {
            name: summary,
            description: descriptionToMarkdown(root.component),
            creationDate: new Date(),
            updateDate: new Date(),
            status: 'imported',
            author: '',
            originId: makeOriginId(uid),
            minAge: null,
            maxAge: null,
            price: null,
            url: place.url,
            tags: [],
            publicTypes: [],
            eventType: [],
          },
          dates,
          tags: categoriesOf(root.component),
          publicTypes: [],
          eventTypes: [],
        },
      })
    }
  }

  previews.sort((a, b) => Date.parse(a.firstStart) - Date.parse(b.firstStart))
  const truncated = previews.length > ICAL_MAX_EVENTS

  return {
    calendarName,
    truncated: truncated || undefined,
    events: truncated ? previews.slice(0, ICAL_MAX_EVENTS) : previews,
  }
}
