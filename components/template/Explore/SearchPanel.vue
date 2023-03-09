<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import { Ref } from 'vue';
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const avatars = new Avatars($appwrite().client)

const props = defineProps<{
  currentDate: KDateApi,
  events: Array<KEvent>,
  dates: Array<KDateApiAug>,
  display: KDisplay,
}>()

const emit = defineEmits(['select', 'deselect'])

const state = reactive({
  openPanel: false
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

const qrUrl = ref(avatars.getQR(`https://app.kronikle.eu/dq/${props.display.$id}`).toString())
const qrUrlTarget = ref('')

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
  })
})

onMounted(() => {
  qrUrlTarget.value = `${window.location.hostname}/dq/${props.display.$id}`
  qrUrl.value = avatars.getQR(`${window.location.origin}/dq/${props.display.$id}`).toString()

  document.getElementById(`date-card-${props.currentDate.$id}`)?.scrollIntoView()
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
    <div class="bg-urfist-200 py-8 px-8 text-center w-64 h-64 rounded-lg">
      <div class="font-semibold text-lg leading-none text-primary-200-kv3 mb-3">{{ $t('displays.kronikle-v3.find-page-on-phone-qr') }}</div>
      <img class="w-36 h-36 m-auto border-4" :src="qrUrl" />
      <div class="underline text-primary-200-kv3 font-light text-lg mt-1">{{ qrUrlTarget }}</div>
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
