<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { required, requiredUnless, url } from '@vuelidate/validators'
import { Databases, Query, Permission, Role } from 'appwrite'
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
const {$appwrite} = useNuxtApp()

const props = defineProps({
  display: {
    type: Object,
    required: false
  }
})

const databases = new Databases($appwrite().client)
const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization
const accountData = await $appwrite().account.get()

const availableTags = ref([] as Array<{$id: string, name: string}>)
const availablePublicTypes = ref([] as Array<{$id: string, name: string}>)
const availableEventTypes = ref([] as Array<{$id: string, name: string}>)
const availableEvents = ref([] as Array<{$id: string, name: string}>)

onMounted(() => {
  const databases = new Databases($appwrite().client)
  let promiseArray = []
  promiseArray.push($appwrite().getAllPages('kronikle', 'tag').then((response) => {
    availableTags.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'public-type').then((response) => {
    availablePublicTypes.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'event-type').then((response) => {
    availableEventTypes.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'event').then((response) => {
    availableEvents.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))

  Promise.all(promiseArray).then(values => {
    state.events = state.events.map(e => ({$id: e.$id, name: availableEvents.value.find(ae => ae.$id == e.$id)?.name}))
    state.publicFilter = state.publicFilter.map(e => ({$id: e.$id, name: availablePublicTypes.value.find(ae => ae.$id == e.$id)?.name}))
    state.typeFilter = state.typeFilter.map(e => ({$id: e.$id, name: availableEventTypes.value.find(ae => ae.$id == e.$id)?.name}))
    state.tagFilter = state.tagFilter.map(e => ({$id: e.$id, name: availableTags.value.find(ae => ae.$id == e.$id)?.name}))
  })
})

const state = reactive({
  name: '',
  template: '',
  events: [] as {$id: string, name: string | undefined}[],
  eventFilter: '',
  publicFilter: [] as {$id: string, name: string | undefined}[],
  typeFilter: [] as {$id: string, name: string | undefined}[],
  tagFilter: [] as {$id: string, name: string | undefined}[],
  excludeFilters: false,
})

if (props.display) {
  state.name = props.display.name
  state.template = props.display.template
  state.events = props.display.events.map((e: string) => ({$id: e}))
  state.eventFilter = props.display.eventFilter
  state.publicFilter = props.display.publicFilter.map((e: string) => ({$id: e}))
  state.typeFilter = props.display.typeFilter.map((e: string) => ({$id: e}))
  state.tagFilter = props.display.tagFilter.map((e: string) => ({$id: e}))
  state.excludeFilters = props.display.excludeFilters
}

const templates = [
  {
    name: 'Basic',
    code: 'basic'
  },
  {
    name: 'Explore v3',
    code :'explore-v3'
  }
]

const filters = [
  {
    code: 'none',
    name: 'Aucun sauf les événements distincts sélectionnés'
  },
  {
    code: 'all',
    name: 'Tous'
  },
  {
    code: 'month',
    name: 'Ce mois-ci'
  },
  {
    code: 'week',
    name: 'Cette semaine'
  },
  {
    code: 'upcoming',
    name: 'À venir'
  }
]

const rules = {
  name: {
    required
  },
  template: {
    required
  }
}

const v$ = useVuelidate(rules, state)

async function addDisplay() {
  const newDisplay = {
    name: state.name,
    template: state.template,
    events: state.events.map(e => e.$id),
    eventFilter: state.eventFilter,
    publicFilter: state.publicFilter.map(pf => pf.$id),
    typeFilter: state.typeFilter.map(tf => tf.$id),
    tagFilter: state.tagFilter.map(tf => tf.$id),
    excludeFilters: state.excludeFilters,
    organization: organization,
  }
  try {
    if (props.display) {
      const result = await databases.updateDocument('kronikle', 'display', props.display.$id, newDisplay)
    } else {
      const result = await databases.createDocument('kronikle', 'display', 'unique()', newDisplay)
    }
    navigateTo('/display')
  } catch (e) {
    console.error('Fail to add Display error : ', e)
  }
}

async function deleteDisplay() {
  if (props.display) {
    try {
      const res = await databases.deleteDocument('kronikle', 'display', props.display.$id)
      navigateTo('/display')
    } catch (e) {
      console.error('Failed to delete Display : ', e)
    }
  }
}

const originUrl = window.location.origin
</script>

<template>
  <div class="p-4">
    <h1 class="h1">{{ props.display ? $t('display.form.update-title') : $t('display.form.title')}} : {{state.name.length > 0 ? state.name : ''}}</h1>
    <div v-if="props.display">
      <span class="font-thin"><NuxtLink target="_blank" :to="originUrl + '/d/' + props.display.$id">{{ originUrl + '/d/' + props.display.$id }}</NuxtLink></span>
    </div>
    <label class="label mt-8">
      <span class="label-text">{{$t('display.form.name-label')}}</span>
    </label>
    <input v-model="state.name" type="text" :placeholder="$t('display.form.name-placeholder')" class="input input-bordered bg-white w-full" />
    <label class="label">
      <span v-if="v$.name.$error && v$.name.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('display.form.template-label')}}</span>
    </label>
    <select v-model="state.template" class="select select-bordered w-full max-w-xs">
      <option disabled selected>Who shot first?</option>
      <option v-for="template of templates" :value="template.code" :key="template.code">{{ template.name }}</option>
    </select>
    <h2>{{ $t('display.form.date-filter-title') }}</h2>
    <label class="label">
      <span class="label-text">{{$t('display.form.date-label')}}</span>
    </label>
    <select v-model="state.eventFilter" class="select select-bordered w-full max-w-xs">
      <option disabled selected>Who shot first?</option>
      <option v-for="filter of filters" :value="filter.code" :key="filter.code">{{ filter.name }}</option>
    </select>
    <h2>{{ $t('display.form.filter-title') }}</h2>
    <label class="label">
      <span class="label-text">{{$t('display.form.additionnal-filter')}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('display.form.tag-filter')}}</span>
    </label>
    <VueMultiselect
      v-model="state.tagFilter"
      :multiple="true"
      :placeholder="$t('display.form.tags-placeholder')"
      :options="availableTags"
      track-by="$id"
      label="name">
    </VueMultiselect>
    <label class="label">
      <span class="label-text">{{$t('display.form.type-filter')}}</span>
    </label>
    <VueMultiselect
      v-model="state.typeFilter"
      :multiple="true"
      :placeholder="$t('display.form.type-filter-placeholder')"
      :options="availableEventTypes"
      track-by="$id"
      label="name">
    </VueMultiselect>
    <label class="label">
      <span class="label-text">{{$t('display.form.public-filter')}}</span>
    </label>
    <VueMultiselect
      v-model="state.publicFilter"
      :multiple="true"
      :placeholder="$t('display.form.public-filter-placeholder')"
      :options="availablePublicTypes"
      track-by="$id"
      label="name">
    </VueMultiselect>
    <div class="form-control">
      <label class="label cursor-pointer justify-start space-x-4">
        <input v-model="state.excludeFilters" type="checkbox" class="checkbox" />
        <span class="label-text">{{$t('display.form.exclude-filters')}}</span> 
      </label>
    </div>
    <h2>{{ $t('display.form.pick-events-title') }}</h2>
    <label class="label">
      <span class="label-text">{{$t('display.form.pick-events')}}</span>
    </label>
    <VueMultiselect
      v-model="state.events"
      :multiple="true"
      :placeholder="$t('display.form.pick-events-placeholder')"
      :options="availableEvents"
      track-by="$id"
      label="name">
    </VueMultiselect>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-primary mt-4 grow" @click="addDisplay">{{ props.display ? $t('display.form.update') : $t('display.form.add')}}</button>
      <button v-if="props.display" class="btn btn-outline btn-primary mt-4 grow" @click="deleteDisplay">{{ $t('display.form.delete')}}</button>
    </div>
  </div>
</template>