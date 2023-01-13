<script lang="ts" setup>
import Appwrite from '@/utils/appwrite'
import { Databases, Permission, Role, Query } from 'appwrite'
import { organizationId } from '~~/server/api/third-party/sygefor-33/SygeforImporterConfig';

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const state = reactive({
  query: '',
  organization: 'none'
})

const { data: events, pending, refresh, error } = await useFetch(() => `/api/third-party/${state.organization}/list?query=${state.query}`)

onBeforeMount (async () => {
  const account = Appwrite.account
  console.log(account)
  const prefs = await account.getPrefs()
  if (!prefs.organization) {
    return
  } else {
    state.organization = prefs.organization
  }
})

async function search () {
  if (state.organization != 'none') {
    refresh()
  }
}

async function importEvent(eventId: string) {
  const databases = new Databases(Appwrite.client)
  let existingTags = [] as {$id: string, name: string}[]
  let tagIds = [] as string[]
  let existingPublicTypes = [] as {$id: string, name: string}[]
  let publicTypesIds = [] as string[]
  let existingEventTypes = [] as {$id: string, name: string}[]
  let eventTypesIds = [] as string[]

  // Get the KImportEvent Object
  const event = await $fetch(`/api/third-party/${state.organization}/event/${eventId}`)
  // Go through the tags and create the new ones
  const tagsResponse = await databases.listDocuments('kronikle', 'tag', [
    Query.equal('author', ['all', state.organization])
  ])
  existingTags = tagsResponse.documents.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  for (const tag of event.tags) {
    let found = existingTags.find((t) => t.name === tag)
    if (found) {
      tagIds.push(found.$id)
    } else {
      const tagObj = await databases.createDocument('kronikle', 'tag', 'unique()', {
        name: tag,
        author: state.organization
      })
      tagIds.push(tagObj.$id)
    }
  }
  // Go through the publicTypes and create the new ones
  const publicTypesResponse = await databases.listDocuments('kronikle', 'public-type', [
    Query.equal('author', ['all', state.organization])
  ])
  existingPublicTypes = publicTypesResponse.documents.map((doc): {$id: string, name: string} => {
    return {
      $id: doc.$id,
      name: doc.name
    }
  })
  for (const publicType of event.publicTypes) {
    let found = existingPublicTypes.find((t) => t.name === publicType)
    if (found) {
      publicTypesIds.push(found.$id)
    } else {
      const obj = await databases.createDocument('kronikle', 'public-type', 'unique()', {
        name: publicType,
        author: state.organization
      })
      publicTypesIds.push(obj.$id)
    }
  }
  // Go through the eventTypes and create the new ones
  const eventTypesResponse = await databases.listDocuments('kronikle', 'event-type', [
    Query.equal('author', ['all', state.organization])
  ])
  existingEventTypes = eventTypesResponse.documents.map((doc): {$id: string, name: string} => {
    return {
      $id: doc.$id,
      name: doc.name
    }
  })
  for (const eventType of event.eventTypes) {
    let found = existingEventTypes.find((t) => t.name === eventType)
    if (found) {
      eventTypesIds.push(found.$id)
    } else {
      const obj = await databases.createDocument('kronikle', 'event-type', 'unique()', {
        name: eventType,
        author: state.organization
      })
      eventTypesIds.push(obj.$id)
    }
  }
  // Create the event, with the correct tags, publicTypes, and eventTypes ids
  const eventObj = await databases.createDocument('kronikle', 'event', 'unique()', {
    ...event.event,
    organization: state.organization,
    tags: tagIds,
    publicTypes: publicTypesIds,
    eventType: eventTypesIds
  })
  // Create the Dates with the correct eventId
  let datesPromises = [] as Array<Promise<any>>
  for (const d of event.dates) {
    d.eventId = eventObj.$id
    datesPromises.push(databases.createDocument('kronikle', 'date', 'unique()', d as any))
  }
  // Redirect to /event/:eventId
  Promise.all(datesPromises).then(() => {
    console.log('import OK')
    navigateTo('/admin')
  })
}


</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{$t('event.import.title')}}</h2>
    <p>{{$t('event.import.subtitle')}} {{state.organization}}</p>
    <label class="label">
      <span class="label-text">{{$t('event.import.name-label')}}</span>
    </label>
    <input v-model="state.query" type="text" :placeholder="$t('event.import.name-placeholder')" class="input input-bordered bg-white w-full" @keypress.enter="search">
    <div 
      @click="importEvent(event.id)"
      v-for="event of events"
      :key="event.id"
      class="my-3 bg-white card shadow py-2 px-4 cursor-pointer hover:shadow-lg">
      <div class="font-bold">{{event.name}}</div>
      <div v-for="date of event.date" :key="date" class="text-sm">{{(new Date(date)).toLocaleDateString()}}</div>
    </div>
  </div>
</template>