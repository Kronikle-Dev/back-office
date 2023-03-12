<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import {DateTime} from 'luxon'
import 'v-calendar/dist/style.css';
import { Ref } from 'vue';
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const avatars = new Avatars($appwrite().client)
const i18n = useI18n()

const props = defineProps<{
  currentDate: KDateApi,
  events: Array<KEvent>,
  dates: Array<KDateApiAug>,
  display: KDisplay,
}>()

const emit = defineEmits(['select', 'deselect'])

const state = reactive({
  openPanel: false,
  range: {
    start: null as unknown as string,
    end: null as unknown as string,
  },
})

const tagsIds = computed(() => {
  const allIds = [] as string[]
  props.events.forEach(e => allIds.push(...e.tags as string[]))
  return new Set(allIds)
})

const typesIds = computed(() => {
  const allIds = [] as string[]
  props.events.forEach(e => allIds.push(...e.eventType as string[]))
  return new Set(allIds)
})

const publicsIds = computed(() => {
  const allIds = [] as string[]
  props.events.forEach(e => allIds.push(...e.publicTypes as string[]))
  return new Set(allIds)
})

const tags: Ref<{$id: string, name: string}[]> = ref([])
const eventTypes: Ref<{$id: string, name: string}[]> = ref([])
const publicTypes: Ref<{$id: string, name: string}[]> = ref([])

//const selectedTags: string[] = ref([])
const selectedEventTypes: Ref<string[]> = ref([])
const selectedPublicTypes: Ref<string[]> = ref([])


tags.value = ((await databases.listDocuments('kronikle', 'tag',
  [
    Query.equal('$id', [...tagsIds.value])
  ])).documents as unknown as {$id: string, name: string}[])

  
eventTypes.value = ((await databases.listDocuments('kronikle', 'event-type',
  [
    Query.equal('$id', [...typesIds.value])
  ])).documents as unknown as {$id: string, name: string}[])

publicTypes.value = ((await databases.listDocuments('kronikle', 'public-type',
  [
    Query.equal('$id', [...publicsIds.value])
  ])).documents as unknown as {$id: string, name: string}[])

watch(publicsIds, async (newVal, oldVal) => {
  publicTypes.value = (await databases.listDocuments('kronikle', 'public-type',
  [
    Query.equal('$id', [...newVal])
  ])).documents as unknown as {$id: string, name: string}[]
})

watch(typesIds, async (newVal, oldVal) => {
  eventTypes.value = (await databases.listDocuments('kronikle', 'event-type',
  [
    Query.equal('$id', [...newVal])
  ])).documents as unknown as {$id: string, name: string}[]
})


watch(tagsIds, async (newVal, oldVal) => {
  tags.value = (await databases.listDocuments('kronikle', 'tag',
  [
    Query.equal('$id', [...newVal])
  ])).documents as unknown as {$id: string, name: string}[]
})

watch(state, (newVal, oldVal) => {
  if (newVal.openPanel) {
    setTimeout(() => {
    const settingsHeight = document.querySelector('.settings-panel')?.clientHeight // Il n'existe pas encore ici !!!
    document.querySelector('.dates-panel')?.setAttribute("style",`height:${settingsHeight}px`)
    }, 50)
  } else {
    document.querySelector('.dates-panel')?.removeAttribute('style')
  }
})

function selectEventType (etype: string) {
  selectedEventTypes.value.push(etype)
}

function deselectEventType (etype: string) {
  const index = selectedEventTypes.value.indexOf(etype)
  selectedEventTypes.value.splice(index, 1)
}

function selectPublicType (publict: string) {
  selectedPublicTypes.value.push(publict)
}

function deselectPublicType (publict: string) {
  const index = selectedEventTypes.value.indexOf(publict)
  selectedPublicTypes.value.splice(index, 1)
}

const filteredDates = computed(() => {
  const beginDateFilter = state.range.start ? DateTime.fromJSDate(new Date(state.range.start)).minus({hours: 12}) : null
  const endDateFilter =  state.range.end ? DateTime.fromJSDate(new Date(state.range.end)).plus({hours: 24}) : null

  return props.dates.filter(date => {
    let hasEventType = false
    if (selectedEventTypes.value.length === 0) return true
    date.event?.eventType?.forEach(t => {
      if (selectedEventTypes.value.includes(t)) {
        hasEventType = true
      }
    })
    return hasEventType
  }).filter(date => {
    let hasPublicType = false
    if (selectedPublicTypes.value.length === 0) return true
    date.event?.publicTypes?.forEach(t => {
      if (selectedPublicTypes.value.includes(t)) {
        hasPublicType = true
      }
    })
    return hasPublicType
  }).filter(date => {
    if (beginDateFilter && endDateFilter) {
      return DateTime.fromISO(date.startDateTime) >= beginDateFilter && DateTime.fromISO(date.startDateTime) <= endDateFilter
    } else if (beginDateFilter) {
      return DateTime.fromISO(date.startDateTime) >= beginDateFilter
    } else if (endDateFilter) {
      return DateTime.fromISO(date.startDateTime) <= endDateFilter
    } else {
      return true
    }
  })
})

onMounted(() => {
  document.getElementById(`date-card-${props.currentDate.$id}`)?.scrollIntoView()
})

/** DATEPICKER CUSTOM DROPDOWN */
const inputDate = ref<string | Date>()
const vcDate = ref<string | Date>()

const startDate = computed(() => {
  return state.range.start ? DateTime.fromJSDate(new Date(state.range.start)).setLocale('fr-FR').toLocaleString() : i18n.t('displays.kronikle-v3.enter-start-date-filter')
})

const endDate = computed(() => {
  return state.range.end ? DateTime.fromJSDate(new Date(state.range.end)).setLocale('fr-FR').toLocaleString() :  i18n.t('displays.kronikle-v3.enter-end-date-filter')
})

// You DON NOT need following lines if the Dropdown component in your UI lib
// already handles open/close with clickOutside
const el = ref<HTMLDivElement>()

const open = ref(false)
const onFocus = () => open.value = true

const onClickOutside = (e: MouseEvent) => {
  if (el.value && !el.value.contains(e.target as Node)) {
    open.value = false
  }
}

watch(el, (el, _, onCleanup) => {
  if (!el) {
    return
  }

  document.addEventListener('click', onClickOutside)

  onCleanup(() => {
    document.removeEventListener('click', onClickOutside)
  })
})
</script>

<template>
  <div class="max-w-xs flex flex-col space-y-5 items-center pb-8 z-30">
    <div class="bg-primary-400-kv3 rounded-r-lg flex flex-row self-start relative"
      :class="{
        'max-h-[65vh]': !state.openPanel,
        'h-fit': state.openPanel
        }">
      <div  class="absolute right-0 p-4 bg-primary-300-kv3 z-40 rounded-bl-lg rounded-tr-lg cursor-pointer"
            @click="state.openPanel = !state.openPanel"><span>🔍</span></div>
      <div
        v-if="state.openPanel"
        class="bg-primary-300-kv3 py-8 px-16 transition-all  w-[465px] h-fit settings-panel">
        <h1 class="text-primary-900-kv3 font-extrabold text-2xl">{{ $t('displays.kronikle-v3.find-an-event') }}</h1>
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.date') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div>
        <div ref="el" class="dropdown" :class="{ 'dropdown-open': open }">
          <label for="pick-a-day" class="flex flex-row items-center mb-4">
            <button
              id="pick-a-start"
              name="pick-a-day"
              class="btn btn-sm rounded-lg bg-white"
              :class="{'text-primary-400-kv3': !state.range.start, 'text-primary-50-kv3': state.range.start}"
              placeholder="31-07-2022"
              @focus="onFocus"
            >{{ startDate }}</button>
            
            <svg
              class="w-4 h-4 mx-2 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <button
              id="pick-an-end"
              name="pick-a-day"
              class="btn btn-sm rounded-lg bg-white"
              :class="{'text-primary-400-kv3': !state.range.start, 'text-primary-50-kv3': state.range.start}"
              placeholder="31-08-2023"
              @focus="onFocus"
            >{{ endDate }}</button>
          </label>

          <div class="dropdown-content mt-3">
            <ClientOnly>
              <v-date-picker
                v-model="state.range"
                color="blue"
                class="w-64"
                is-range
              />
            </ClientOnly>
          </div>
        </div>
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.event-type') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div> 
        <div class="flex flex-row flex-wrap">
          <TemplateExploreEventTypeButton
            v-for="etype of eventTypes"
            :key="etype.$id"
            @deselect="deselectEventType"
            @select="selectEventType"
            :type-name="etype.name"
            :type-id="etype.$id"
            :add-icon="true"
            class="mb-2.5 mr-2.5">
          </TemplateExploreEventTypeButton>
        </div>
        <h2 class="text-primary-900-kv3 font-extrabold text-xl mt-4">{{ $t('displays.kronikle-v3.event-public') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div>
        <div class="flex flex-row flex-wrap">
          <TemplateExplorePublicTypeButton
            v-for="publict of publicTypes"
            :key="publict.$id"
            @deselect="deselectPublicType"
            @select="selectPublicType"
            :public-name="publict.name"
            :public-id="publict.$id"
            :add-icon="true"
            class="mb-2.5 mr-2.5">
          </TemplateExplorePublicTypeButton>
        </div>
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.event-theme') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div> 
      </div>
      <div class="py-8 px-16 max-h-full overflow-y-scroll nobar dates-panel">
        <div v-if="!state.openPanel" class="text-primary-900-kv3 font-extrabold text-2xl mb-5">{{ $t('displays.kronikle-v3.find-an-event') }}</div>
        <div class="flex grow transition-all"
          :class="{
            'flex-col': !state.openPanel,
            'w-[14rem]': !state.openPanel,
            'space-y-2.5': !state.openPanel,
            'flex-row': state.openPanel,
            'flex-wrap': state.openPanel,
            'gap-2.5': state.openPanel,
            'w-[28rem]': state.openPanel
            }">
          <nuxt-link
              :to="`/d/${display.$id}/date/${date.$id}`"
              :id="`date-card-${date.$id}`"
              v-for="date of filteredDates" >
            <TemplateExploreEventCard
              :event="date.event"
              :date="date">
            </TemplateExploreEventCard>
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
 /* Hide scrollbar for Chrome, Safari and Opera */
 .nobar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.nobar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
} 
</style>
