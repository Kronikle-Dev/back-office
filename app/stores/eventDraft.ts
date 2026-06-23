import { defineStore } from 'pinia'
import { Databases, Permission, Role, Query } from 'appwrite'

const emptyEvent = () => ({
  name: '',
  description: '',
  creationDate: '',
  updateDate: '',
  status: 'published',
  author: '',
  originId: '',
  imageId: '',
  imageUrl: null,
  price: null,
  url: null,
  tags: [] as string[],
  publicTypes: [] as string[],
  eventType: [] as string[],
  organization: '',
  minAge: null,
  maxAge: null,
})

export const useEventDraftStore = defineStore('eventDraft', () => {
  const { $appwrite } = useNuxtApp()

  const event = reactive(emptyEvent())
  const dates = ref<KDate[]>([])
  const step = ref(0)
  const loading = ref(false)
  const existingEventId = ref<string | null>(null)

  const availableTags = ref<Array<{ $id: string; name: string }>>([])
  const availablePublicTypes = ref<Array<{ $id: string; name: string }>>([])
  const availableEventTypes = ref<Array<{ $id: string; name: string }>>([])

  function initForCreate(teamId: string) {
    reset()
    event.organization = teamId
  }

  function initFromExisting(existingEvent: KEvent, existingDates: KDate[]) {
    reset()
    existingEventId.value = existingEvent.$id ?? null
    Object.assign(event, {
      name: existingEvent.name,
      description: existingEvent.description,
      status: existingEvent.status,
      author: existingEvent.author,
      originId: existingEvent.originId ?? '',
      imageId: existingEvent.imageId ?? '',
      imageUrl: existingEvent.imageUrl ?? null,
      price: existingEvent.price,
      url: existingEvent.url,
      tags: existingEvent.tags ?? [],
      publicTypes: existingEvent.publicTypes ?? [],
      eventType: existingEvent.eventType ?? [],
      organization: existingEvent.organization ?? '',
      minAge: existingEvent.minAge,
      maxAge: existingEvent.maxAge,
    })
    dates.value = existingDates
  }

  function updateFragment(fragment: Partial<typeof event>) {
    Object.assign(event, fragment)
  }

  function setDates(newDates: KDate[]) {
    dates.value = newDates
  }

  function nextStep() {
    step.value++
  }

  function prevStep() {
    step.value--
  }

  function goToStep(n: number) {
    step.value = n
  }

  async function fetchReferenceData() {
    if (!event.organization) return

    const tagsResp = await $appwrite().getAllPages('kronikle', 'tag', [
      Query.equal('author', event.organization),
    ])
    availableTags.value = tagsResp.map((doc: any) => ({ $id: doc.$id, name: doc.name }))

    const ptResp = await $appwrite().getAllPages('kronikle', 'public-type', [
      Query.equal('author', event.organization),
    ])
    availablePublicTypes.value = ptResp.map((doc: any) => ({ $id: doc.$id, name: doc.name }))

    const etResp = await $appwrite().getAllPages('kronikle', 'event-type', [
      Query.equal('author', event.organization),
    ])
    availableEventTypes.value = etResp.map((doc: any) => ({ $id: doc.$id, name: doc.name }))
  }

  async function publish() {
    loading.value = true

    event.creationDate = new Date().toISOString() as any
    event.updateDate = new Date().toISOString() as any

    const databases = new Databases($appwrite().client)
    const org = event.organization

    let eventId: string

    if (existingEventId.value) {
      await databases.updateDocument('kronikle', 'event', existingEventId.value, event)
      eventId = existingEventId.value
    } else {
      const inserted = await databases.createDocument('kronikle', 'event', 'unique()', event, [
        Permission.delete(Role.team(org)),
        Permission.update(Role.team(org)),
        Permission.read(Role.any()),
      ])
      eventId = inserted.$id
    }

    const datePromises = dates.value
      .filter((d: any) => d.new)
      .map((d: any) => {
        d.eventId = eventId
        delete d['$id']
        delete d['new']
        return databases.createDocument('kronikle', 'date', 'unique()', d, [
          Permission.delete(Role.team(org)),
          Permission.update(Role.team(org)),
          Permission.read(Role.any()),
        ])
      })

    await Promise.all(datePromises)
    loading.value = false
    navigateTo('/')
  }

  function reset() {
    Object.assign(event, emptyEvent())
    dates.value = []
    step.value = 0
    loading.value = false
    existingEventId.value = null
    availableTags.value = []
    availablePublicTypes.value = []
    availableEventTypes.value = []
  }

  return {
    event,
    dates,
    step,
    loading,
    existingEventId,
    availableTags,
    availablePublicTypes,
    availableEventTypes,
    initForCreate,
    initFromExisting,
    updateFragment,
    setDates,
    nextStep,
    prevStep,
    goToStep,
    fetchReferenceData,
    publish,
    reset,
  }
})
