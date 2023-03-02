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
  <div class="max-w-xs flex flex-col space-y-5 items-center pb-8">
    <div class="bg-primary-400-kv3 max-h-[65vh] overflow-y-scroll nobar py-8 px-16 rounded-r-lg">
      <div class="text-primary-900-kv3 font-extrabold text-2xl mb-5">{{ $t('displays.kronikle-v3.find-an-event') }}</div>
      <div class="flex flex-col space-y-2.5">
        <TemplateExploreEventCard
          v-for="date of props.dates"
          :event="date.event"
          :date="date">
        </TemplateExploreEventCard>
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
