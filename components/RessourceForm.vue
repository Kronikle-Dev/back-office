<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { required, requiredUnless, url } from '@vuelidate/validators'
import { Databases, Query } from 'appwrite'
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
const {$appwrite} = useNuxtApp()

const databases = new Databases($appwrite().client)
const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization
const accountData = await $appwrite().account.get()

const props = defineProps<{
  event: KEvent,
}>()

const resources = ref([] as KResource[])

resources.value = (await databases.listDocuments('kronikle', 'resource', [
  Query.equal('organization', organization),
  Query.equal('eventId', props.event.$id as string)
])).documents as unknown as KResource[]

$appwrite().client.subscribe(['databases.kronikle.collections.resource.documents'], async () => {
  console.log('refresh resources')
  resources.value = (await databases.listDocuments('kronikle', 'resource', [
    Query.equal('organization', organization),
    Query.equal('eventId', props.event.$id as string)
  ])).documents as unknown as KResource[]
})

const state = reactive({
  name: '',
  description: '',
  isOwnResource: false,
  resourceType: '',
  imageUrl: '',
  imageAlt: '',
  tags: [] as {name: string, code: string}[]
})

const resourceUrl = ref('')

const tags = computed(() => {
  return [...new Set(resources.value.map(r => r.tags).flat())].map(t => ({name: t, code: t}))
})

const rules = {
  name: {
    required
  },
  description: {
    required: requiredUnless(resourceUrl.value.length > 0)
  },
}

const urlRules = {
  resourceUrl: {
    url
  }
}

watch(resourceUrl, async (newUrl, oldUrl) => {
  const isUrlCorrect = await vurl$.value.$validate()
  if (isUrlCorrect) {
    const result = await $fetch(`/api/open-graph?url=${resourceUrl.value}`)
    if (!result.error && result.og.success) {
      state.name = result.og.ogTitle
      state.imageUrl = result.og.ogImage.url
    }
  }
})

const v$ = useVuelidate(rules, state)
const vurl$ = useVuelidate(urlRules, {resourceUrl})

function addTag (newTag: string) {
  const tag = {
    name: newTag,
    code: newTag.substring(0, 2) + Math.floor((Math.random() * 10000000))
  }
  state.tags.push(tag)
}

async function addResource() {
  const newResource = {
    eventId: props.event.$id,
    name: state.name,
    description: state.description?.length > 0 ? state.description : null,
    isOwnResource: state.isOwnResource,
    resourceType: state.resourceType,
    imageUrl: state.imageUrl?.length > 0 ? state.imageUrl : null, // ICI C'EST CASSE ! imageUrl == null URL https://zenodo.org/record/7104154#.Y-DlynbMKUk
    imageAlt: state.imageAlt?.length > 0 ? state.imageAlt : null,
    tags: state.tags.map(t => t.name),
    author: accountData.$id,
    organization: organization,
    url: resourceUrl.value?.length > 0 ? resourceUrl.value : null
  }
  try {
    const result = await databases.createDocument('kronikle', 'resource', 'unique()', newResource)
    resourceUrl.value = ''
    state.name = ''
    state.description = ''
    state.isOwnResource = false
    state.resourceType = ''
    state.imageUrl = ''
    state.imageAlt = ''
    state.tags = []
  } catch (e) {
    console.error('Fail to add Resource to event ', props.event.$id, ' error : ', e)
  }
}
</script>

<template>
  <div class="p-4">
    <div class="card w-96 bg-white shadow-xl" v-if="state.name.length > 0 || resourceUrl.length > 0 || state.description.length > 0 || state.imageUrl.length > 0 || state.tags.length > 0 ">
      <figure v-if="state.imageUrl?.length > 0"><img :src="state.imageUrl" :alt="state.imageAlt" /></figure>
      <div class="card-body">
        <h2 class="card-title"
          v-if="state.name.length > 0">
          {{state.name}}
        </h2>
        <p v-if="resourceUrl.length > 0"><a :href="resourceUrl" class="text-sm">{{resourceUrl}}</a></p>
        <p v-if="state.description.length > 0">{{state.description}}</p>
        <div class="card-actions justify-end">
          <div class="badge badge-outline" v-for="tag of state.tags" :key="tag.name">{{tag.name}}</div>
        </div>
      </div>
    </div>
    <label class="label">
      <span class="label-text">{{$t('resource.form.url-label')}}</span>
    </label>
    <input v-model="resourceUrl" type="text" :placeholder="$t('resource.form.url-placeholder')" class="input input-bordered bg-white w-full" />
    <label class="label">
      <span v-if="vurl$.resourceUrl.$error && vurl$.resourceUrl.url.$invalid" class="label-text-alt text-error">{{$t('validation.valid-url')}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('resource.form.name-label')}}</span>
    </label>
    <input v-model="state.name" type="text" :placeholder="$t('resource.form.name-placeholder')" class="input input-bordered bg-white w-full" />
    <label class="label">
      <span v-if="v$.name.$error && v$.name.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('resource.form.description-label')}}</span>
    </label>
    <textarea v-model="state.description" class="textarea textarea-bordered bg-white w-full" :placeholder="$t('resource.form.description-placeholder')"/>
    <label class="label">
      <span v-if="v$.description.$error && v$.description.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('resource.form.tags')}}</span>
    </label>
    <VueMultiselect
      v-model="state.tags"
      :multiple="true"
      :taggable="true"
      :close-on-select="true"
      :placeholder="$t('resource.form.tags-placeholder')"
      :options="tags"
      track-by="code"
      @tag="addTag"
      label="name">
    </VueMultiselect>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="addResource">{{$t('resource.add')}}</button>
    </div>
  </div>
</template>