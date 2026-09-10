<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import type { Ref } from 'vue';
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
        Query.equal('$id', [...tagsIds.value]),
        Query.equal('author', props.display.organization)
      ])).documents as unknown as {$id: string, name: string}[]).slice(0, 6)
  } catch (e) {
    console.log(e)
  }
}

if (allTagsIds.value.size > 0) {
  try {
    allTags.value = ((await databases.listDocuments('kronikle', 'tag',
      [
        Query.equal('$id', [...allTagsIds.value]),
        Query.equal('author', props.display.organization)
      ])).documents as unknown as {$id: string, name: string}[]).slice(0, 6)
  } catch (e) {
    console.log(e)
  }
}

watch(tagsIds, async (newVal, oldVal) => {
  try {
    tags.value = (await databases.listDocuments('kronikle', 'tag',
    [
      Query.equal('$id', [...newVal]),
      Query.equal('author', props.display.organization)
    ])).documents as unknown as {$id: string, name: string}[]
  } catch (e) {
    console.log(e)
  }
})

// `open` ne concerne que le tiroir mobile (< lg) : sur desktop le panneau est
// toujours visible via CSS (`lg:block`), donc pas de lecture de `window` ni de
// mismatch d'hydratation. On referme le tiroir après un choix de thème.
const open = ref(false)

function relaySelect (tag: string) {
  emit('select', tag)
  open.value = false
}

function relayDeselect (tag: string) {
  emit('deselect', tag)
  open.value = false
}

onMounted(() => {
  qrUrlTarget.value = `${window.location.hostname}/dq/${props.display.$id}`
  qrUrl.value = avatars.getQR(`${window.location.origin}/dq/${props.display.$id}`).toString()
})

</script>

<template>
  <div class="shrink-0 lg:h-full lg:min-h-0">
    <!-- Bouton flottant d'ouverture, mobile/tablette uniquement -->
    <button
      v-if="!open"
      type="button"
      @click="open = true"
      :aria-label="$t('displays.kronikle-v3.our-themes')"
      class="lg:hidden fixed bottom-6 left-4 z-30 btn btn-primary btn-circle bg-primary-400-kv3 border-none text-xl shadow-lg">
      #
    </button>
    <!-- Tiroir (< lg) / colonne latérale (lg+) -->
    <div class="lg:static lg:z-auto lg:block lg:h-full" :class="open ? 'fixed inset-0 z-40 flex' : 'hidden'">
      <div class="absolute inset-0 bg-black/40 lg:hidden" @click="open = false"></div>
      <aside class="relative z-10 h-full w-[min(100vw-3rem,28rem)] overflow-y-auto nobar bg-primary-400-kv3 lg:mt-6 lg:h-auto lg:max-h-full lg:w-auto lg:max-w-md lg:bg-transparent rounded-r-lg">
        <div class="bg-primary-400-kv3 py-6 md:py-8 px-6 md:px-10 xl:px-16 rounded-r-lg lg:rounded-br-none">
          <div class="flex flex-row items-start justify-between gap-4 mb-5">
            <div class="text-primary-900-kv3 font-extrabold text-xl md:text-2xl">{{ $t('displays.kronikle-v3.our-themes') }}</div>
            <button type="button" @click="open = false" aria-label="Fermer" class="lg:hidden btn btn-sm btn-circle bg-primary-100-kv3 border-none text-primary-900-kv3 shrink-0">✕</button>
          </div>
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
          <div class="text-primary-700-kv3 font-bold text-lg md:text-xl mt-6">{{ $t('displays.kronikle-v3.search-themes') }}</div>
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
        <!-- QR code : inutile sur l'appareil qui le flasherait -->
        <div class="hidden lg:block bg-primary-600-kv3 py-8 px-10 xl:px-16 rounded-br-lg">
          <div class="font-semibold text-lg text-primary-200-kv3 mb-3">{{ $t('displays.kronikle-v3.find-our-program-qr') }}</div>
          <img class="w-36 h-36 m-auto border-4" :src="qrUrl" alt="QR code" />
          <div class="underline text-primary-200-kv3 font-light text-lg mt-3 break-all">{{ qrUrlTarget }}</div>
        </div>
      </aside>
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
  padding: 6px 22px 6px 16px;
  border-radius: 20px;
  background-color: #39445A;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.375rem;
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