<script lang="ts" setup>
const props = defineProps<{
  organization: string,
  existingOriginIds: string[],
}>()

const emit = defineEmits<{ imported: [originId: string] }>()

const url = ref('')
const includePast = ref(false)
const loading = ref(false)
const loaded = ref(false)
const errorCode = ref('')
const calendarName = ref('')
const truncated = ref(false)
const events = ref<IcalPreviewEvent[]>([])
const selected = ref<Set<string>>(new Set())
const search = ref('')

// Au-delà de ce seuil, la liste devient difficile à parcourir à l'œil.
const SEARCH_THRESHOLD = 50

const importing = ref(false)
const progress = reactive({ done: 0, total: 0 })
const failures = ref<string[]>([])
const successCount = ref(0)

const { importKEvent, resetCache } = useEventImporter(props.organization)
const { urls: savedUrls, load: loadSavedUrls, remember, forget } = useIcalUrlMemory(props.organization)

onMounted(() => {
  loadSavedUrls()
})

const isImported = (event: IcalPreviewEvent) => props.existingOriginIds.includes(event.originId)
const showSearch = computed(() => events.value.length > SEARCH_THRESHOLD)

/**
 * La saisie est interprétée comme une expression régulière insensible à la casse.
 * Tant qu'elle est incomplète (« ( » en cours de frappe) `RegExp` lève : on retombe
 * alors sur une simple recherche de sous-chaîne pour que le champ reste utilisable.
 */
const matcher = computed<((text: string) => boolean) | null>(() => {
  const term = search.value.trim()
  if (!term) return null
  try {
    const expression = new RegExp(term, 'i')
    return (text: string) => expression.test(text)
  } catch {
    const lowered = term.toLowerCase()
    return (text: string) => text.toLowerCase().includes(lowered)
  }
})

const filteredEvents = computed(() => {
  const test = matcher.value
  if (!test) return events.value
  return events.value.filter(e => test(e.name) || test(e.import.event?.description ?? ''))
})

// « Tout sélectionner » n'agit que sur ce qui est affiché : la sélection faite sous
// une autre recherche est conservée.
const visibleImportable = computed(() => filteredEvents.value.filter(e => !isImported(e)))
const allSelected = computed(() => visibleImportable.value.length > 0 && visibleImportable.value.every(e => selected.value.has(e.originId)))

function toggle (event: IcalPreviewEvent) {
  if (isImported(event)) return
  if (selected.value.has(event.originId)) {
    selected.value.delete(event.originId)
  } else {
    selected.value.add(event.originId)
  }
}

function toggleAll () {
  const next = new Set(selected.value)
  for (const event of visibleImportable.value) {
    if (allSelected.value) next.delete(event.originId)
    else next.add(event.originId)
  }
  selected.value = next
}

async function loadCalendar () {
  if (!url.value.trim() || loading.value) return
  loading.value = true
  errorCode.value = ''
  successCount.value = 0
  failures.value = []
  try {
    const response = await $fetch<IcalPreviewResponse>('/api/ical/preview', {
      query: { url: url.value.trim(), includePast: includePast.value ? '1' : '0' },
    })
    if (response.error) {
      errorCode.value = response.error
      events.value = []
      selected.value = new Set()
      loaded.value = false
    } else {
      calendarName.value = response.calendarName ?? ''
      truncated.value = Boolean(response.truncated)
      events.value = response.events
      selected.value = new Set()
      search.value = ''
      loaded.value = true
      remember(url.value.trim())
    }
  } catch (e) {
    console.log(e)
    errorCode.value = 'fetch-failed'
    events.value = []
    loaded.value = false
  }
  loading.value = false
}

// La fenêtre des événements passés est appliquée côté serveur : il faut recharger.
watch(includePast, () => {
  if (loaded.value) loadCalendar()
})

function useSavedUrl (saved: string) {
  url.value = saved
  loadCalendar()
}

async function importSelected () {
  const toImport = events.value.filter(e => selected.value.has(e.originId) && !isImported(e))
  if (toImport.length === 0 || importing.value) return

  importing.value = true
  resetCache()
  failures.value = []
  successCount.value = 0
  progress.done = 0
  progress.total = toImport.length

  for (const event of toImport) {
    try {
      await importKEvent(event.import)
      emit('imported', event.originId)
      selected.value.delete(event.originId)
      successCount.value += 1
    } catch (e) {
      console.log(e)
      failures.value.push(event.name)
    }
    progress.done += 1
  }

  importing.value = false
  if (successCount.value > 0) {
    setTimeout(() => { successCount.value = 0 }, 8000)
  }
}

function formatDate (iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
}
</script>

<template>
  <div>
    <label class="label" for="ical-url">
      <span class="label-text">{{ $t('event.import.ical.url-label') }}</span>
    </label>
    <div class="flex gap-2 not-prose">
      <input
        id="ical-url"
        v-model="url"
        type="url"
        :placeholder="$t('event.import.ical.url-placeholder')"
        class="input input-bordered bg-white w-full"
        @keypress.enter="loadCalendar">
      <button class="btn btn-primary" :disabled="loading || !url.trim()" @click="loadCalendar">
        <span v-if="loading" class="loading loading-spinner loading-sm" />
        {{ $t('event.import.ical.load') }}
      </button>
    </div>

    <div v-if="savedUrls.length" class="mt-3">
      <div class="text-sm opacity-70">{{ $t('event.import.ical.saved-urls') }}</div>
      <div class="flex flex-wrap gap-2 mt-1 not-prose">
        <div v-for="saved of savedUrls" :key="saved" class="badge badge-outline gap-2 py-3 max-w-full">
          <button class="truncate max-w-[16rem]" :title="saved" @click="useSavedUrl(saved)">{{ saved }}</button>
          <button class="opacity-60 hover:opacity-100" :title="$t('event.import.ical.forget')" @click="forget(saved)">✕</button>
        </div>
      </div>
    </div>

    <label class="label cursor-pointer justify-start gap-2 mt-3">
      <input v-model="includePast" type="checkbox" class="checkbox checkbox-sm">
      <span class="label-text">{{ $t('event.import.ical.include-past') }}</span>
    </label>

    <div v-if="errorCode" class="alert alert-error mt-4">
      <span>{{ $t(`event.import.ical.errors.${errorCode}`) }}</span>
    </div>

    <div v-if="loaded && events.length === 0" class="alert mt-4">
      <span>{{ $t('event.import.ical.calendar-empty') }}</span>
    </div>

    <div v-if="truncated" class="alert alert-warning mt-4">
      <span>{{ $t('event.import.ical.truncated') }}</span>
    </div>

    <div v-if="events.length" class="mt-6">
      <div class="flex items-center justify-between gap-4">
        <h3 class="m-0">{{ calendarName || $t('event.import.ical.default-calendar-name') }}</h3>
        <button class="btn btn-sm btn-ghost" :disabled="visibleImportable.length === 0" @click="toggleAll">
          {{ allSelected ? $t('event.import.ical.deselect-all') : $t('event.import.ical.select-all') }}
        </button>
      </div>

      <div v-if="showSearch" class="mt-3 not-prose">
        <input
          v-model="search"
          type="search"
          :placeholder="$t('event.import.ical.search-placeholder')"
          class="input input-bordered input-sm bg-white w-full">
        <div class="text-sm opacity-70 mt-1">
          <span v-if="search.trim()">{{ $t('event.import.ical.search-results', { shown: filteredEvents.length, total: events.length }) }}</span>
          <span v-else>{{ $t('event.import.ical.search-hint') }}</span>
        </div>
      </div>

      <div v-if="filteredEvents.length === 0" class="alert mt-4">
        <span>{{ $t('event.import.ical.search-empty') }}</span>
      </div>

      <div
        v-for="event of filteredEvents"
        :key="event.originId"
        class="my-3 bg-white card shadow py-2 px-4 flex flex-row justify-between items-center gap-4"
        :class="{ 'opacity-50': isImported(event) }">
        <div class="flex items-start gap-3 min-w-0">
          <input
            type="checkbox"
            class="checkbox mt-1 shrink-0"
            :checked="selected.has(event.originId)"
            :disabled="isImported(event) || importing"
            @change="toggle(event)">
          <div class="min-w-0">
            <div class="font-bold">{{ event.name }}</div>
            <div class="text-sm">
              {{ formatDate(event.firstStart) }}
              <span v-if="event.occurrences > 1">
                — {{ $t('event.import.ical.other-sessions', { n: event.occurrences - 1 }, event.occurrences - 1) }}
              </span>
            </div>
            <div v-if="event.location" class="text-sm opacity-70 truncate">{{ event.location }}</div>
          </div>
        </div>
        <div class="shrink-0 flex flex-col items-end gap-1">
          <span v-if="event.recurring" class="badge badge-outline">{{ $t('event.import.ical.recurring') }}</span>
          <span v-if="event.past" class="badge badge-ghost">{{ $t('event.import.ical.past') }}</span>
          <span v-if="isImported(event)" class="text-sm">{{ $t('event.import.already-imported') }}</span>
        </div>
      </div>

      <div class="flex items-center gap-4 mt-4">
        <button class="btn btn-primary" :disabled="importing || selected.size === 0" @click="importSelected">
          {{ $t('event.import.ical.import-button', { n: selected.size }, selected.size) }}
        </button>
        <div v-if="importing" class="flex items-center gap-2">
          <progress class="progress progress-primary w-40" :value="progress.done" :max="progress.total" />
          <span class="text-sm">{{ $t('event.import.ical.progress', { done: progress.done, total: progress.total }) }}</span>
        </div>
      </div>

      <div v-if="failures.length" class="alert alert-error mt-4 flex-col items-start">
        <span>{{ $t('event.import.ical.failed') }}</span>
        <ul class="list-disc ml-6 my-0">
          <li v-for="failure of failures" :key="failure">{{ failure }}</li>
        </ul>
      </div>
    </div>

    <div v-if="successCount" class="toast toast-end z-50">
      <div class="alert alert-success">
        <span>{{ $t('event.import.ical.success', { n: successCount }, successCount) }}</span>
        <nuxt-link to="/" class="btn btn-sm">{{ $t('event.import.ical.see-events') }}</nuxt-link>
      </div>
    </div>
  </div>
</template>
