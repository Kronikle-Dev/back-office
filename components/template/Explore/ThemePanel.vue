<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import { Ref } from 'vue';
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const avatars = new Avatars($appwrite().client)

const props = defineProps<{
  events: Array<KEvent>,
  display: KDisplay,
}>()

const emit = defineEmits(['select', 'deselect'])

const tagsIds = computed(() => {
  const tagsMap = [] as {id: string, count: number}[]
  props.events.forEach(e => {
    e.tags?.forEach(t => {
      let tagObj = tagsMap.find(tm => tm.id == t)
      if (!tagObj) {
        tagsMap.push({id: t, count: 1})
      } else {
        tagObj.count = tagObj.count + 1
      }
    })
  })

  return new Set(tagsMap.sort((a, b) => {
    return b.count - a.count
  }).slice(0, 5).map(tm => tm.id))
})

//TODO à améliorer perf
const allTagsIds = computed(() => {
  const tagsMap = [] as {id: string, count: number}[]
  props.events.forEach(e => {
    e.tags?.forEach(t => {
      let tagObj = tagsMap.find(tm => tm.id == t)
      if (!tagObj) {
        tagsMap.push({id: t, count: 1})
      } else {
        tagObj.count = tagObj.count + 1
      }
    })
  })

  return new Set(tagsMap.sort((a, b) => {
    return b.count - a.count
  }).map(tm => tm.id))
})

const tags: Ref<{$id: string, name: string}[]> = ref([])
const allTags: Ref<{$id: string, name: string}[]> = ref([])
const selectedTags: Ref<any[]> = ref([])

const qrUrl = ref(avatars.getQR(`https://app.kronikle.eu/dq/${props.display.$id}`).toString())
const qrUrlTarget = ref('')

if (tagsIds.value.size > 0) {
  try {
    tags.value = ((await databases.listDocuments('kronikle', 'tag',
      [
        Query.equal('$id', [...tagsIds.value])
      ])).documents as unknown as {$id: string, name: string}[]).slice(0, 6)
  } catch (e) {
    console.log(e)
  }
}

if (allTagsIds.value.size > 0) {
  try {
    allTags.value = ((await databases.listDocuments('kronikle', 'tag',
      [
        Query.equal('$id', [...allTagsIds.value])
      ])).documents as unknown as {$id: string, name: string}[]).slice(0, 6)
  } catch (e) {
    console.log(e)
  }
}

watch(tagsIds, async (newVal, oldVal) => {
  try {
    tags.value = (await databases.listDocuments('kronikle', 'tag',
    [
      Query.equal('$id', [...newVal])
    ])).documents as unknown as {$id: string, name: string}[]
  } catch (e) {
    console.log(e)
  }
})

function relaySelect (tag: string) {
  emit('select', tag)
}

function relayDeselect (tag: string) {
  emit('deselect', tag)
}

const showPanel = ref(false)

onBeforeMount(() => {
  window.innerWidth < 640 ? showPanel.value = false : showPanel.value = true
})

onMounted(() => {
  qrUrlTarget.value = `${window.location.hostname}/dq/${props.display.$id}`
  qrUrl.value = avatars.getQR(`${window.location.origin}/dq/${props.display.$id}`).toString()
})

</script>

<template>
  <div class="rounded-r-lg max-h-screen max-w-md">
    <div v-if="!showPanel" @click="showPanel = true" class="btn btn-primary btn-circle cursor-pointer bg-primary-400-kv3 fixed bottom-10 left-4 p-4  rounded-full">
      #
    </div>
    <div v-if="showPanel" @click="showPanel = false" class="sm:hidden cursor-pointer btn btn-primary bg-primary-400-kv3 absolute bottom-10 left-6 p-3 text-center rounded-full btn-circle">X</div>
    <div v-if="showPanel" class="bg-primary-400-kv3 py-8 px-16 rounded-r-lg sm:rounded-br-none">
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
      <div class="text-primary-700-kv3 font-bold text-xl mt-6">{{ $t('displays.kronikle-v3.search-themes') }}</div>
      <ClientOnly>
        <VueMultiselect
          class="mt-4"
          v-model="selectedTags"
          @select="relaySelect($event.$id)"
          @remove="relayDeselect($event.$id)"
          :multiple="true"
          :close-on-select="true"
          :placeholder="$t('displays.kronikle-v3.tags-placeholder')"
          :selectLabel="$t('displays.kronikle-v3.select-label')"
          :selectedLabel="$t('displays.kronikle-v3.selected-label')"
          :deselectLabel="$t('displays.kronikle-v3.deselect-label')"
          label="name"
          track-by="$id"
          :options="allTags">
        </VueMultiselect>
      </ClientOnly>
    </div>
    <div v-if="showPanel" class="hidden sm:block bg-primary-600-kv3 py-8 px-16 rounded-br-lg">
      <div class="font-semibold text-lg text-primary-200-kv3 mb-3">{{ $t('displays.kronikle-v3.find-our-program-qr') }}</div>
      <img class="w-36 h-36 m-auto border-4" :src="qrUrl" />
      <div class="underline text-primary-200-kv3 font-light text-lg mt-3">{{ qrUrlTarget }}</div>
    </div>
  </div>
</template>

<style>

.multiselect__select {
  height: 100%;
}

.multiselect__tags {
  border-radius: 30px;
}

.multiselect__tag {
  padding: 9px 24px 9px 20px;
  border-radius: 20px;
  background-color: #39445A;
  color: white;
  font-size: 18px;
  font-weight: 500;
  line-height: 22px;
}

.multiselect__tag-icon {
  line-height: 32px;
}

.multiselect__tag-icon:after {
  color:#EEE;
}

.multiselect--above .multiselect__content-wrapper {
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
}

.multiselect__option--highlight {
  background-color: #39445A;
}

.multiselect__option--highlight:after {
  background-color: #39445A;
}
</style>