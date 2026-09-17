import { Databases, Permission, Role, Query } from 'appwrite'
import { usePlaces } from '@/composables/usePlaces'

type RefDoc = { $id: string, name: string }
type RefCollection = 'tag' | 'public-type' | 'event-type'

/**
 * Création d'un événement (et de ses séances) à partir du contrat pivot
 * `KImportEvent`, partagée par les différents importeurs. Les référentiels sont
 * résolus par nom et mis en cache pour la durée du lot : un même tag apparaissant
 * dans plusieurs événements n'est créé qu'une fois.
 */
export function useEventImporter (organization: string) {
  const { $appwrite } = useNuxtApp()
  const databases = new Databases($appwrite().client)
  const places = usePlaces(organization)

  const caches: Record<RefCollection, RefDoc[] | null> = {
    'tag': null,
    'public-type': null,
    'event-type': null,
  }

  const permissions = () => [
    Permission.delete(Role.team(organization)),
    Permission.update(Role.team(organization)),
    Permission.read(Role.any()),
  ]

  function resetCache () {
    caches.tag = null
    caches['public-type'] = null
    caches['event-type'] = null
    places.invalidate()
  }

  async function resolveRefs (collection: RefCollection, names: string[]): Promise<string[]> {
    if (names.length === 0) return []
    if (!caches[collection]) {
      const response = await $appwrite().getAllPages('kronikle', collection, [
        Query.equal('author', ['all', organization]),
      ])
      caches[collection] = response.map((doc): RefDoc => ({ $id: doc.$id, name: doc.name }))
    }
    const known = caches[collection] as RefDoc[]
    const ids: string[] = []
    for (const name of names) {
      const found = known.find(ref => ref.name === name)
      if (found) {
        ids.push(found.$id)
        continue
      }
      const created = await databases.createDocument('kronikle', collection, 'unique()', {
        name,
        author: organization,
      }, permissions())
      known.push({ $id: created.$id, name })
      ids.push(created.$id)
    }
    return ids
  }

  /** Crée l'événement puis ses séances. Renvoie l'id du document `event`. */
  async function importKEvent (imp: KImportEvent): Promise<string> {
    if (imp.error || !imp.event) {
      throw new Error(imp.error || 'event.import.errors.empty')
    }

    const tagIds = await resolveRefs('tag', imp.tags)
    const publicTypeIds = await resolveRefs('public-type', imp.publicTypes)
    const eventTypeIds = await resolveRefs('event-type', imp.eventTypes)

    const eventObj = await databases.createDocument('kronikle', 'event', 'unique()', {
      ...imp.event,
      organization,
      tags: tagIds,
      publicTypes: publicTypeIds,
      eventType: eventTypeIds,
    }, permissions())

    await Promise.all(imp.dates.map((date) => {
      const { $id, new: isNew, ...payload } = date as KDate & { $id?: string }
      return databases.createDocument('kronikle', 'date', 'unique()', {
        ...payload,
        eventId: eventObj.$id,
      }, permissions())
    }))

    // Lieux des séances importées : non bloquant, l'événement est déjà créé.
    try {
      await places.ensureMany(imp.dates.map((d) => ({ name: d.placeName ?? '', description: d.placeDescription ?? '' })))
    } catch (e) {
      console.warn('Enregistrement des lieux importés impossible', e)
    }

    return eventObj.$id
  }

  return { importKEvent, resetCache }
}
