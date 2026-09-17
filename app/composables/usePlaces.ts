import { Databases, Permission, Role, Query } from 'appwrite'

// Référentiel des lieux d'une organisation (collection `place`).
//
// Le lieu d'une séance reste dénormalisé sur le document `date` (`placeName`,
// `placeDescription`) : ce référentiel ne sert qu'à proposer des lieux à la
// saisie. Renommer ou supprimer un lieu ne modifie donc aucune séance.
//
// Contrairement aux autres référentiels, les documents sont lisibles par la
// seule équipe : les pages publiques ne les consultent jamais.

const DB = 'kronikle'
const COLLECTION = 'place'
export const PLACE_NAME_MAX = 200
export const PLACE_DESCRIPTION_MAX = 500

type PlaceInput = { name: string, description?: string }

/** Erreur métier portant une clé i18n (`place.errors.*`), affichée en toast. */
export class PlaceError extends Error {
  constructor (public readonly key: string) {
    super(key)
    this.name = 'PlaceError'
  }
}

/** Clé de comparaison des noms : trim, espaces internes réduits, minuscules. */
export function normalizePlaceName (name: string): string {
  return (name ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr')
}

function toPlace (doc: any): KPlace {
  return {
    $id: doc.$id,
    name: doc.name ?? '',
    description: doc.description ?? '',
    author: doc.author ?? '',
  }
}

function byName (a: KPlace, b: KPlace) {
  return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
}

export function usePlaces (organization: string) {
  const { $appwrite } = useNuxtApp()
  const databases = new Databases($appwrite().client)

  // Cache de la liste, trié par nom.
  const places = ref<KPlace[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  const permissions = () => [
    Permission.read(Role.team(organization)),
    Permission.update(Role.team(organization)),
    Permission.delete(Role.team(organization)),
  ]

  function invalidate () {
    loaded.value = false
    places.value = []
  }

  async function list (force = false): Promise<KPlace[]> {
    if (loaded.value && !force) return places.value
    loading.value = true
    try {
      const docs = await $appwrite().getAllPages(DB, COLLECTION, [Query.equal('author', organization)])
      places.value = docs.map(toPlace).sort(byName)
      loaded.value = true
      return places.value
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded () {
    if (!loaded.value) await list()
  }

  function findByName (name: string): KPlace | undefined {
    const key = normalizePlaceName(name)
    if (!key) return undefined
    return places.value.find((p) => normalizePlaceName(p.name) === key)
  }

  function clean (input: PlaceInput) {
    return {
      name: (input.name ?? '').trim(),
      description: (input.description ?? '').trim(),
    }
  }

  function validate (name: string, description: string) {
    if (!name) throw new PlaceError('place.errors.empty-name')
    if (name.length > PLACE_NAME_MAX) throw new PlaceError('place.errors.name-too-long')
    if (description.length > PLACE_DESCRIPTION_MAX) throw new PlaceError('place.errors.description-too-long')
  }

  async function create (input: PlaceInput): Promise<KPlace> {
    const { name, description } = clean(input)
    validate(name, description)
    await ensureLoaded()
    if (findByName(name)) throw new PlaceError('place.errors.duplicate')
    const doc = await databases.createDocument(DB, COLLECTION, 'unique()', {
      name,
      description,
      author: organization,
    }, permissions())
    const place = toPlace(doc)
    places.value = [...places.value, place].sort(byName)
    return place
  }

  // Ne touche jamais aux séances : elles gardent leur copie du lieu.
  async function update (id: string, patch: PlaceInput): Promise<KPlace> {
    const { name, description } = clean(patch)
    validate(name, description)
    await ensureLoaded()
    const duplicate = findByName(name)
    if (duplicate && duplicate.$id !== id) throw new PlaceError('place.errors.duplicate')
    const doc = await databases.updateDocument(DB, COLLECTION, id, { name, description })
    const place = toPlace(doc)
    places.value = places.value.map((p) => (p.$id === id ? place : p)).sort(byName)
    return place
  }

  async function remove (id: string): Promise<void> {
    await databases.deleteDocument(DB, COLLECTION, id)
    places.value = places.value.filter((p) => p.$id !== id)
  }

  // Retrouve un lieu par son nom ou le crée. Un lieu existant n'est pas modifié
  // (le référentiel fait foi, la séance garde sa propre description).
  // Renvoie null pour un nom vide (séance sans lieu).
  async function ensure (input: PlaceInput): Promise<{ place: KPlace, created: boolean } | null> {
    const { name, description } = clean(input)
    if (!name) return null
    await ensureLoaded()
    const existing = findByName(name)
    if (existing) return { place: existing, created: false }
    const doc = await databases.createDocument(DB, COLLECTION, 'unique()', {
      name: name.slice(0, PLACE_NAME_MAX),
      description: description.slice(0, PLACE_DESCRIPTION_MAX),
      author: organization,
    }, permissions())
    const place = toPlace(doc)
    places.value = [...places.value, place].sort(byName)
    return { place, created: true }
  }

  // Dédoublonne les entrées puis les traite une par une : deux créations
  // parallèles du même nom produiraient un doublon, le cache n'étant mis à jour
  // qu'au retour de chaque requête.
  async function ensureMany (inputs: PlaceInput[]): Promise<{ created: number, existing: number, skipped: number }> {
    const unique = new Map<string, PlaceInput>()
    let skipped = 0
    for (const input of inputs) {
      const { name, description } = clean(input)
      const key = normalizePlaceName(name)
      if (!key) { skipped++; continue }
      const known = unique.get(key)
      if (!known) {
        unique.set(key, { name, description })
      } else if (!known.description && description) {
        known.description = description
      }
    }
    let created = 0
    let existing = 0
    for (const input of unique.values()) {
      const result = await ensure(input)
      if (!result) { skipped++; continue }
      if (result.created) created++
      else existing++
    }
    return { created, existing, skipped }
  }

  // Rattrapage : parcourt les séances des événements de l'organisation et crée
  // les lieux qui manquent au référentiel.
  async function importFromDates (options: { includeArchived?: boolean } = {}) {
    const eventQueries = [Query.equal('organization', organization)]
    if (!options.includeArchived) eventQueries.push(Query.notEqual('status', 'archived'))
    const events = await $appwrite().getAllPages(DB, 'event', eventQueries)

    // Appwrite limite le nombre de valeurs d'un `Query.equal` : lots de 100.
    const ids = events.map((e) => e.$id as string)
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
    const pages = await Promise.all(chunks.map((chunk) =>
      $appwrite().getAllPages(DB, 'date', [Query.equal('eventId', chunk)], undefined, 1000)))
    const dates = pages.flat()

    const { created } = await ensureMany(dates.map((d) => ({
      name: d.placeName ?? '',
      description: d.placeDescription ?? '',
    })))
    return { created, scannedDates: dates.length, scannedEvents: events.length }
  }

  return {
    places,
    loaded,
    loading,
    list,
    findByName,
    create,
    update,
    remove,
    ensure,
    ensureMany,
    importFromDates,
    invalidate,
  }
}
