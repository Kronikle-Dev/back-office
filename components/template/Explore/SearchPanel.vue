<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import { Ref } from 'vue';
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const avatars = new Avatars($appwrite().client)

const props = defineProps<{
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

const tags: Ref<{$id: string, name: string}[]> = ref([])

const qrUrl = ref(avatars.getQR(`https://app.kronikle.eu/dq/${props.display.$id}`).toString())
const qrUrlTarget = ref('')

tags.value = ((await databases.listDocuments('kronikle', 'tag',
  [
    Query.equal('$id', [...tagsIds.value])
  ])).documents as unknown as {$id: string, name: string}[]).slice(0,6)

watch(tagsIds, async (newVal, oldVal) => {
  tags.value = (await databases.listDocuments('kronikle', 'tag',
  [
    Query.equal('$id', [...newVal])
  ])).documents as unknown as {$id: string, name: string}[]
})

function relaySelect (tag: string) {
  emit('select', tag)
}

function relayDeselect (tag: string) {
  emit('deselect', tag)
}

onMounted(() => {
  qrUrlTarget.value = `${window.location.hostname}/dq/${props.display.$id}`
  qrUrl.value = avatars.getQR(`${window.location.origin}/dq/${props.display.$id}`).toString()
})
</script>

<template>
  <div class="max-w-xs flex flex-col space-y-5 items-center pb-8 z-30">
    <div class="bg-primary-400-kv3 max-h-[65vh] overflow-y-scroll nobar rounded-r-lg flex flex-row self-start relative">
      <div class="absolute right-0 p-4 bg-primary-300-kv3 z-40 rounded-bl-lg cursor-pointer" @click="state.openPanel = !state.openPanel"><span>🙂</span></div>
      <div
        v-if="state.openPanel"
        class="bg-primary-300-kv3 py-8 px-16 transition-all">
        <h1 class="text-primary-900-kv3 font-extrabold text-2xl">{{ $t('displays.kronikle-v3.find-an-event') }}</h1>
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.date') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div> 
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.event-type') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div> 
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.event-public') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div> 
        <h2 class="text-primary-900-kv3 font-extrabold text-xl">{{ $t('displays.kronikle-v3.event-theme') }}</h2>
        <div class="divider before:bg-white after:bg-white before:h-1 after:h-1 mt-0"></div> 
      </div>
      <div class="py-8 px-16 max-h-full overflow-y-scroll nobar"
        :class="{'w-[43rem]': state.openPanel}">
        <div v-if="!state.openPanel" class="text-primary-900-kv3 font-extrabold text-2xl mb-5">{{ $t('displays.kronikle-v3.find-an-event') }}</div>
        <div class="flex transition-all"
          :class="{
            'flex': !state.openPanel,
            'flex-col': !state.openPanel,
            'w-[14rem]': !state.openPanel,
            'space-y-2.5': !state.openPanel,
            'flex-row': state.openPanel,
            'flex-wrap': state.openPanel,
            'gap-2.5': state.openPanel,
            'w-[28rem]': state.openPanel
            }">
          <TemplateExploreEventCard
            v-for="date of props.dates"
            :event="date.event"
            :date="date">
          </TemplateExploreEventCard>
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
