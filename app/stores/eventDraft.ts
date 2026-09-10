import { defineStore } from 'pinia'
import { Databases, Permission, Role, Query } from 'appwrite'

// Store de l'assistant de création / édition d'événement (New1 → New6).
//
// C'est l'unique état du formulaire : les étapes lient leurs champs directement
// sur `event` et `dates` (v-model), il n'y a pas de copie locale à resynchroniser.
// Le brouillon est persisté en sessionStorage à chaque modification, pour survivre
// à un rafraîchissement de la page ; il est effacé à la publication ou sur demande.

const DB = 'kronikle'
const STORAGE_KEY = 'kronikle:eventDraft'
export const LAST_STEP = 5

type ReferenceItem = { $id: string, name: string }

// Brouillon d'événement : un KEvent sans les champs gérés par Appwrite, avec les
// tableaux toujours définis pour simplifier les liaisons.
export type DraftEvent = Omit<KEvent, '$id' | 'creationDate' | 'updateDate' | 'tags' | 'publicTypes' | 'eventType'> & {
  tags: string[],
  publicTypes: string[],
  eventType: string[],
}

interface PersistedDraft {
  existingEventId: string | null,
  event: DraftEvent,
  dates: KDate[],
  step: number,
  maxReachedStep: number,
}

const emptyEvent = (): DraftEvent => ({
  name: '',
  description: '',
  status: 'published',
  author: '',
  originId: '',
  imageId: '',
  imageUrl: undefined,
  price: null,
  url: null,
  tags: [],
  publicTypes: [],
  eventType: [],
  organization: '',
  minAge: null,
  maxAge: null,
})

// Les champs numériques sont saisis dans des <input type="text"> : on tolère donc
// des chaînes dans le brouillon et on normalise au moment de l'envoi.
function toIntOrNull (value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = parseInt(String(value), 10)
  return Number.isNaN(n) ? null : n
}

function toFloatOrNull (value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = parseFloat(String(value).replace(',', '.'))
  return Number.isNaN(n) ? null : n
}

function reviveDate (d: KDate): KDate {
  return {
    ...d,
    startDateTime: new Date(d.startDateTime),
    endDateTime: new Date(d.endDateTime),
  }
}

// Une clé par cible : le brouillon d'une création et ceux des éditions coexistent.
function storageKey (existingEventId: string | null) {
  return `${STORAGE_KEY}:${existingEventId ?? 'new'}`
}

function readPersistedDraft (existingEventId: string | null): PersistedDraft | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(storageKey(existingEventId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedDraft
    parsed.dates = (parsed.dates ?? []).map(reviveDate)
    return parsed
  } catch (e) {
    console.warn('Brouillon illisible, ignoré', e)
    return null
  }
}

export const useEventDraftStore = defineStore('eventDraft', () => {
  const { $appwrite } = useNuxtApp()

  const event = reactive<DraftEvent>(emptyEvent())
  const dates = ref<KDate[]>([])
  const step = ref(0)
  // Étape la plus avancée déjà validée : borne les sauts (URL, clic sur la barre).
  const maxReachedStep = ref(0)
  const loading = ref(false)
  const error = ref('')
  const existingEventId = ref<string | null>(null)
  // Vrai quand l'initialisation a repris un brouillon du sessionStorage (bandeau).
  const restoredFromDraft = ref(false)
  // Snapshot de l'événement tel qu'en base (mode édition), pour `discardDraft`.
  let source: { event: KEvent, dates: KDate[] } | null = null

  const availableTags = ref<ReferenceItem[]>([])
  const availablePublicTypes = ref<ReferenceItem[]>([])
  const availableEventTypes = ref<ReferenceItem[]>([])
  let referenceLoadedFor: string | null = null

  const isEditing = computed(() => existingEventId.value !== null)

  const orderedDates = computed(() =>
    [...dates.value]
      .map(reviveDate)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
  )

  // ---------------------------------------------------------------------------
  // Persistance du brouillon
  // ---------------------------------------------------------------------------

  let persistenceEnabled = false

  function persist () {
    if (!persistenceEnabled || !import.meta.client) return
    const payload: PersistedDraft = {
      existingEventId: existingEventId.value,
      event: { ...event },
      dates: dates.value,
      step: step.value,
      maxReachedStep: maxReachedStep.value,
    }
    try {
      sessionStorage.setItem(storageKey(existingEventId.value), JSON.stringify(payload))
    } catch (e) {
      console.warn('Impossible de sauvegarder le brouillon', e)
    }
  }

  function clearPersistedDraft () {
    if (!import.meta.client) return
    try { sessionStorage.removeItem(storageKey(existingEventId.value)) } catch { /* stockage indisponible */ }
  }

  watch([event, dates, step, maxReachedStep], persist, { deep: true })

  function applyPersistedDraft (draft: PersistedDraft) {
    Object.assign(event, emptyEvent(), draft.event)
    dates.value = draft.dates
    maxReachedStep.value = Math.min(Math.max(draft.maxReachedStep ?? 0, 0), LAST_STEP)
    step.value = Math.min(Math.max(draft.step ?? 0, 0), maxReachedStep.value)
    restoredFromDraft.value = true
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  // Un brouillon vide (formulaire jamais rempli) ne mérite pas d'être restauré.
  function hasContent (draft: PersistedDraft) {
    return draft.event.name.length > 0 || draft.event.description.length > 0 || draft.dates.length > 0
  }

  function initForCreate (teamId: string) {
    reset()
    event.organization = teamId
    const draft = readPersistedDraft(null)
    if (draft && draft.event.organization === teamId && hasContent(draft)) {
      applyPersistedDraft(draft)
    }
    persistenceEnabled = true
  }

  function initFromExisting (existingEvent: KEvent, existingDates: KDate[]) {
    reset()
    source = { event: existingEvent, dates: existingDates }
    existingEventId.value = existingEvent.$id ?? null
    Object.assign(event, {
      name: existingEvent.name,
      description: existingEvent.description,
      status: existingEvent.status,
      author: existingEvent.author,
      originId: existingEvent.originId ?? '',
      imageId: existingEvent.imageId ?? '',
      imageUrl: existingEvent.imageUrl ?? undefined,
      price: existingEvent.price,
      url: existingEvent.url,
      tags: existingEvent.tags ?? [],
      publicTypes: existingEvent.publicTypes ?? [],
      eventType: existingEvent.eventType ?? [],
      organization: existingEvent.organization ?? '',
      minAge: existingEvent.minAge,
      maxAge: existingEvent.maxAge,
    })
    dates.value = existingDates.map(reviveDate)

    const draft = readPersistedDraft(existingEventId.value)
    if (draft && hasContent(draft)) {
      // Les séances déjà en base sont reprises fraîches depuis Appwrite (elles ont pu
      // être annulées ou supprimées entre-temps) ; seules les nouvelles viennent du brouillon.
      const persistedNew = draft.dates.filter((d) => d.new)
      applyPersistedDraft({ ...draft, dates: [...dates.value, ...persistedNew] })
    }
    persistenceEnabled = true
  }

  // Abandonne le brouillon repris et repart de l'état initial (création vide, ou
  // événement tel qu'en base).
  function discardDraft () {
    clearPersistedDraft()
    if (source) {
      initFromExisting(source.event, source.dates)
    } else {
      initForCreate(event.organization ?? '')
    }
  }

  function reset () {
    persistenceEnabled = false
    Object.assign(event, emptyEvent())
    dates.value = []
    step.value = 0
    maxReachedStep.value = 0
    loading.value = false
    error.value = ''
    existingEventId.value = null
    restoredFromDraft.value = false
    source = null
  }

  // ---------------------------------------------------------------------------
  // Navigation entre les étapes
  // ---------------------------------------------------------------------------

  function nextStep () {
    goToStep(step.value + 1, true)
  }

  function prevStep () {
    goToStep(step.value - 1)
  }

  // `unlock` : l'étape courante vient d'être validée, la suivante devient accessible.
  function goToStep (n: number, unlock = false) {
    if (!Number.isInteger(n)) return
    const target = Math.min(Math.max(n, 0), LAST_STEP)
    if (unlock) {
      maxReachedStep.value = Math.max(maxReachedStep.value, target)
    }
    step.value = Math.min(target, maxReachedStep.value)
  }

  // ---------------------------------------------------------------------------
  // Référentiels (tags, publics, types)
  // ---------------------------------------------------------------------------

  async function fetchReferenceData (force = false) {
    const org = event.organization
    if (!org) return
    if (!force && referenceLoadedFor === org) return

    const toItems = (docs: any[]): ReferenceItem[] => docs.map((doc) => ({ $id: doc.$id, name: doc.name }))
    const byOrg = [Query.equal('author', org)]
    try {
      const [tags, publicTypes, eventTypes] = await Promise.all([
        $appwrite().getAllPages(DB, 'tag', byOrg),
        $appwrite().getAllPages(DB, 'public-type', byOrg),
        $appwrite().getAllPages(DB, 'event-type', byOrg),
      ])
      availableTags.value = toItems(tags)
      availablePublicTypes.value = toItems(publicTypes)
      availableEventTypes.value = toItems(eventTypes)
      referenceLoadedFor = org
    } catch (e) {
      console.error('Chargement des référentiels impossible', e)
      setError('event.new.reference-error')
    }
  }

  // ---------------------------------------------------------------------------
  // Séances
  // ---------------------------------------------------------------------------

  function databases () {
    return new Databases($appwrite().client)
  }

  function setError (messageKey: string) {
    error.value = messageKey
  }

  function clearError () {
    error.value = ''
  }

  function addDate (date: Omit<KDate, '$id' | 'eventId' | 'new' | 'status'>) {
    dates.value.push({
      ...date,
      $id: `${Date.now()}`,
      eventId: existingEventId.value ?? '',
      status: 'valid',
      new: true,
    })
  }

  // Retire une séance pas encore enregistrée.
  function removeNewDate (id: string | undefined) {
    if (!id) return
    dates.value = dates.value.filter((d) => !(d.new && d.$id === id))
  }

  async function setDateStatus (id: string | undefined, status: 'valid' | 'canceled') {
    const date = dates.value.find((d) => d.$id === id)
    if (!id || !date) return
    const previous = date.status
    date.status = status
    if (date.new) return
    try {
      await databases().updateDocument(DB, 'date', id, { status })
    } catch (e) {
      console.error('Mise à jour de la séance impossible', e)
      date.status = previous
      setError('event.new.date-error')
    }
  }

  const cancelDate = (id: string | undefined) => setDateStatus(id, 'canceled')
  const reinstateDate = (id: string | undefined) => setDateStatus(id, 'valid')

  // Suppression définitive d'une séance déjà en base.
  async function deleteDate (id: string | undefined) {
    const date = dates.value.find((d) => d.$id === id)
    if (!id || !date) return
    if (date.new) {
      removeNewDate(id)
      return
    }
    if (dates.value.length < 2) {
      setError('event.newtwo.keep-at-least-one-date')
      return
    }
    try {
      await databases().deleteDocument(DB, 'date', id)
      dates.value = dates.value.filter((d) => d.$id !== id)
    } catch (e) {
      console.error('Suppression de la séance impossible', e)
      setError('event.new.date-error')
    }
  }

  // ---------------------------------------------------------------------------
  // Publication
  // ---------------------------------------------------------------------------

  function eventPayload () {
    const now = new Date().toISOString()
    return {
      ...event,
      imageUrl: event.imageUrl ?? null,
      minAge: toIntOrNull(event.minAge),
      maxAge: toIntOrNull(event.maxAge),
      price: toFloatOrNull(event.price),
      updateDate: now,
      ...(isEditing.value ? {} : { creationDate: now }),
    }
  }

  function datePayload (date: KDate, eventId: string) {
    const { $id: _id, new: _new, ...rest } = date
    return {
      ...rest,
      eventId,
      maxAttendeeCapacity: toIntOrNull(rest.maxAttendeeCapacity),
    }
  }

  // Crée ou met à jour l'événement, puis insère les séances marquées `new`.
  // Renvoie true en cas de succès ; l'appelant se charge de la navigation.
  async function publish (): Promise<boolean> {
    loading.value = true
    clearError()
    const db = databases()
    const org = event.organization ?? ''
    const teamPermissions = [
      Permission.delete(Role.team(org)),
      Permission.update(Role.team(org)),
      Permission.read(Role.any()),
    ]

    try {
      let eventId: string
      if (existingEventId.value) {
        await db.updateDocument(DB, 'event', existingEventId.value, eventPayload())
        eventId = existingEventId.value
      } else {
        const inserted = await db.createDocument(DB, 'event', 'unique()', eventPayload(), teamPermissions)
        eventId = inserted.$id
      }

      // L'événement existe désormais : un nouvel essai après échec des séances
      // passera par une mise à jour, sans le recréer.
      existingEventId.value = eventId

      const newDates = dates.value.filter((d) => d.new)
      const results = await Promise.allSettled(
        newDates.map((d) => db.createDocument(DB, 'date', 'unique()', datePayload(d, eventId), teamPermissions))
      )
      // Les séances insérées ne sont plus « nouvelles » : si l'envoi d'une autre
      // a échoué, un nouvel essai ne les dupliquera pas.
      results.forEach((result, i) => {
        if (result.status !== 'fulfilled') return
        const local = newDates[i]!
        local.$id = result.value.$id
        local.eventId = eventId
        local.new = false
      })
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failed) throw failed.reason

      persistenceEnabled = false
      clearPersistedDraft()
      return true
    } catch (e) {
      console.error('Publication impossible', e)
      setError('event.new.publish-error')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    event,
    dates,
    orderedDates,
    step,
    maxReachedStep,
    loading,
    error,
    existingEventId,
    isEditing,
    restoredFromDraft,
    availableTags,
    availablePublicTypes,
    availableEventTypes,
    initForCreate,
    initFromExisting,
    discardDraft,
    reset,
    nextStep,
    prevStep,
    goToStep,
    fetchReferenceData,
    addDate,
    removeNewDate,
    cancelDate,
    reinstateDate,
    deleteDate,
    setError,
    clearError,
    publish,
  }
})
