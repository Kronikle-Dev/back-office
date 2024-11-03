<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { required, requiredUnless, url } from '@vuelidate/validators'
import { Databases, Query, Teams, Permission, Role, Storage } from 'appwrite'
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

import vueFilePond from "vue-filepond"
import "filepond/dist/filepond.min.css"
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';

const {$appwrite} = useNuxtApp()

const databases = new Databases($appwrite().client)

let organization = ''
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
if (myTeams.teams.length === 0) {
  organization = ''
}
const myTeamId = myTeams.teams[0].$id
organization = myTeamId
const accountData = await $appwrite().account.get()

const isPremium = (await $appwrite().account?.get()).labels?.includes('premium')

const props = defineProps<{
  event: KEvent,
}>()

const resources = ref([] as KResource[])

resources.value = (await $appwrite().getAllPages('kronikle', 'resource', [
  Query.equal('organization', organization),
  Query.equal('eventId', props.event.$id as string)
])) as unknown as KResource[]

$appwrite().client.subscribe(['databases.kronikle.collections.resource.documents'], async () => {
  console.log('refresh resources')
  resources.value = (await $appwrite().getAllPages('kronikle', 'resource', [
    Query.equal('organization', organization),
    Query.equal('eventId', props.event.$id as string)
  ])) as unknown as KResource[]
})

const state = reactive({
  name: '',
  description: '',
  isOwnResource: true,
  isUrlResource: true,
  isLoading: false,
  resourceType: '',
  imageUrl: '',
  imageAlt: '',
  fileId: '',
  tags: [] as {name: string, code: string}[],
  html: null as unknown as string
})

const resourceUrl = ref('')

const tags = computed(() => {
  return [...new Set(resources.value.map(r => r.tags).flat())].map(t => ({name: t, code: t}))
})


const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateSize
)

const pond = ref(null as any)

const imageToLoad = ref([] as Array<string>)

const serverObj = {
  //@ts-ignore
  revert: async (source: string, load, error) => {
    console.log('state.fileId', state.fileId)
    if (state.fileId.length > 0) {
      const storage = new Storage($appwrite().client)
      const resp = await storage.deleteFile('resource-file', state.fileId)

      load();
    }
  },
  // @ts-ignore
  process: async (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
    const storage = new Storage($appwrite().client)
    if (typeof(file) === 'string') {
      // Image has been loaded from URL
      load(file)
    } else if (file instanceof File) {
      state.isLoading = true
      try {
        const resp = await storage.createFile('resource-file', 'unique()', file)
        const thumbnailId = resp.$id
        const thumbnailUrl = await storage.getFilePreview('resource-file', thumbnailId)
        //state.logoId = thumbnailId
        //state.logoUrl = thumbnailUrl.href
        resourceUrl.value = resourceUrl.value.length > 0 ? resourceUrl.value : (await storage.getFileView('resource-file', thumbnailId)).toString()
        state.fileId = thumbnailId
        state.imageUrl = thumbnailUrl.href
        state.isLoading = false
        load(thumbnailUrl)
      } catch (e) {
        state.isLoading = false
        console.error(e)
        error(e)
      }
    } else {
      load(file)
    }
  },
  fetch: null,
}

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
  if (!state.isUrlResource) {
    return
  }
  const isUrlCorrect = await vurl$.value.$validate()
  if (isUrlCorrect) {
    state.isLoading = true
    try {
      const result = await $fetch(`/api/open-graph?url=${resourceUrl.value}`)
      state.isLoading = false
      if (!result.error) {
        // @ts-ignore
        state.name = result.og?.ogTitle || ''
        // @ts-ignore
        state.imageUrl = state.imageUrl.length > 0 ? state.imageUrl : result.og?.ogImage?.url || ''
        state.html = result?.html || ''
      }
    } catch (e) {
      state.isLoading = false
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
  function checkHttpUrl(str: string) {
    let givenURL;
    try {
        givenURL = new URL(str);
    } catch (error) {
        console.log("error is",error)
      return false;  
    }
    return givenURL.protocol === "http:" || givenURL.protocol === "https:";
  }

  if(state.isLoading) {
    return
  }

  const newResource = {
    eventId: props.event.$id,
    name: state.name,
    description: state.description?.length > 0 ? state.description : null,
    isOwnResource: state.isOwnResource,
    resourceType: state.resourceType,
    imageUrl: state.imageUrl?.length > 0 && checkHttpUrl(state.imageUrl) && !state.imageUrl.includes(' ') ? state.imageUrl : null,
    imageAlt: state.imageAlt?.length > 0 ? state.imageAlt : null,
    tags: state.tags.map(t => t.name),
    author: accountData.$id,
    organization: organization,
    url: resourceUrl.value?.length > 0 ? resourceUrl.value : null,
    html: state.html
  }
  try {
    const result = await databases.createDocument('kronikle', 'resource', 'unique()', newResource, [
      Permission.delete(Role.team(organization)),
      Permission.update(Role.team(organization)),
      Permission.read(Role.any()),
    ])
    resourceUrl.value = ''
    state.name = ''
    state.description = ''
    state.isOwnResource = true
    state.isUrlResource = true
    state.resourceType = ''
    state.imageUrl = ''
    state.imageAlt = ''
    state.tags = []
    state.html = null as unknown as string
    state.fileId = ''
    pond.value.removeFiles()
  } catch (e) {
    console.error('Fail to add Resource to event ', props.event.$id, ' error : ', e)
  }
}
</script>

<template>
  <div class="p-4">
    <h3 class="font-bold mb-4">{{ $t('resource.form.title') }}</h3>
    <div class="card w-96 bg-white shadow-xl" v-if="state.name.length > 0 || resourceUrl.length > 0 || state.description.length > 0 || state.imageUrl.length > 0 || state.tags.length > 0 ">
      <figure v-if="state.imageUrl?.length > 0"><img :src="state.imageUrl" :alt="state.imageAlt" /></figure>
      <div class="card-body overflow-hidden">
        <span class="italic font-light text-primary-400-kv3">{{ $t('resource.form.preview') }}</span>
        <h2 class="card-title"
          v-if="state.name.length > 0">
          {{state.name}}
        </h2>
        <p v-if="resourceUrl.length > 0"><a :href="resourceUrl" class="text-sm">{{resourceUrl}}</a></p>
        <p v-if="state.description.length > 0">{{state.description}}</p>
        <div class="card-actions justify-end">
          <div class="badge badge-outline" v-for="tag of state.tags" :key="tag.name">{{tag.name}}</div>
        </div>
        <div v-if="state.html" v-html="state.html" class="bg-white rounded"></div>
      </div>
    </div>
    <label v-if="state.isUrlResource" class="label">
      <span class="label-text">{{$t('resource.form.url-label')}}</span>
    </label>
    <input v-if="state.isUrlResource" v-model="resourceUrl" type="text" :placeholder="$t('resource.form.url-placeholder')" class="input input-bordered bg-white w-full" />
    <label v-if="state.isUrlResource" class="label">
      <span v-if="vurl$.resourceUrl.$error && vurl$.resourceUrl.url.$invalid" class="label-text-alt text-error">{{$t('validation.valid-url')}}</span>
    </label>
    <div v-if="state.isOwnResource">
      <label v-if="state.isUrlResource" class="label">
        <span class="label-text">{{$t('resource.form.file-label')}}</span>
      </label>
      <ClientOnly>
      <div v-if="!isPremium" class="tooltip tooltip-right w-full" :data-tip="$t('display.form.premium-only')">
        <FilePond
          ref="pond"
          class="mt-9 cursor-pointer"
          credits="false"
          allowMultiple="false"
          max-file-size="28MB"
          disabled="true"
          :label-idle="$t('resource.form.file-placeholder')"
          :server="serverObj"
          :files="imageToLoad"
          v-model="resourceUrl"
        />
        </div>
        <FilePond
          v-if="isPremium"
          ref="pond"
          class="mt-9 cursor-pointer"
          credits="false"
          allowMultiple="false"
          max-file-size="28MB"
          :label-idle="$t('resource.form.file-placeholder')"
          :server="serverObj"
          :files="imageToLoad"
          v-model="resourceUrl"
        />
      </ClientOnly>
    </div>
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