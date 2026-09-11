/**
 * Prévisualisation d'un calendrier iCalendar distant.
 * Comme `open-graph.get.ts`, les erreurs sont renvoyées en HTTP 200 avec un code
 * traduit côté client (`event.import.ical.errors.<code>`).
 */
export default defineEventHandler(async (event): Promise<IcalPreviewResponse> => {
  const query = getQuery(event)

  const normalized = normalizeIcalUrl(query.url as string | undefined)
  if ('error' in normalized) {
    return { error: normalized.error, events: [] }
  }

  const fetched = await fetchIcs(normalized.url)
  if ('error' in fetched) {
    return { error: fetched.error, events: [] }
  }

  const includePast = query.includePast === '1' || query.includePast === 'true'
  return parseIcsToPreview(fetched.ics, { includePast })
})
