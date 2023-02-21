<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import { Ref } from 'vue';
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const avatars = new Avatars($appwrite().client)

const props = defineProps<{
  events: Array<KEvent>,
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
  ])).documents as unknown as {$id: string, name: string}[]).slice(0, 6)

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
  <div class="rounded-r-lg max-h-screen max-w-md">
    <div class="bg-primary-400-kv3 py-8 px-16 rounded-tr-lg">
      <div class="text-primary-900-kv3 font-extrabold text-2xl mb-5">{{ $t('displays.kronikle-v3.our-themes') }}</div>
      <div class="flex flex-col space-y-2.5">
        <TemplateExploreThemeTagButton
          v-for="tag of tags"
          :key="tag.$id"
          @deselect="relayDeselect"
          @select="relaySelect"
          :tag-name="tag.name"
          :tag-id="tag.$id"
          :add-icon="true">
        </TemplateExploreThemeTagButton>
      </div>
    </div>
    <div class="bg-primary-600-kv3 py-8 px-16 rounded-br-lg">
      <div class="font-semibold text-lg text-primary-200-kv3 mb-3">{{ $t('displays.kronikle-v3.find-our-program-qr') }}</div>
      <img class="w-36 h-36 m-auto border-4" :src="qrUrl" />
      <div class="underline text-primary-200-kv3 font-light text-lg mt-3">{{ qrUrlTarget }}</div>
    </div>
  </div>
</template>
