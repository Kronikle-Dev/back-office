<script lang="ts" setup>
import { Databases, Teams, Permission, Role, Query } from 'appwrite'
import { organizationId } from '~~/server/api/third-party/sygefor-33/SygeforImporterConfig';
const {$appwrite} = useNuxtApp()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const state = reactive({
  query: '',
  organization: 'none',
  importing: false,
  importedEventsIds: [] as string[]
})

const { data: events, pending, refresh, error } = await useFetch(() => `/api/third-party/${state.organization}/list?query=${state.query}`)

onBeforeMount (async () => {
  const teams = new Teams($appwrite().client)
  const myTeams = await teams.list()
  if (myTeams.teams.length === 0) {
    return
  }
  const myTeamId = myTeams.teams[0].$id
  state.organization = myTeamId
  $appwrite().getAllPages('kronikle', 'event', [
    Query.equal('organization', state.organization)
  ]).then((response) => {
    state.importedEventsIds = response.map((doc): string => {
      return doc.originId
    })
  }).catch((err) => {
    console.log(err)
  })
})

async function search () {
  if (state.organization != 'none') {
    refresh()
  }
}

async function importEvent(eventId: string) {
  const databases = new Databases($appwrite().client)
  let existingTags = [] as {$id: string, name: string}[]
  let tagIds = [] as string[]
  let existingPublicTypes = [] as {$id: string, name: string}[]
  let publicTypesIds = [] as string[]
  let existingEventTypes = [] as {$id: string, name: string}[]
  let eventTypesIds = [] as string[]

  state.importing = true

  // Get the KImportEvent Object
  let event = {} as KImportEvent
  try {
    // @ts-ignore
    event = (await $fetch(`/api/third-party/${state.organization}/event/${eventId}`)) as KImportEvent
  } catch (err: any) {
    console.log(err.error)
    return
  }
  // Go through the tags and create the new ones
  const tagsResponse = await $appwrite().getAllPages('kronikle', 'tag', [
    Query.equal('author', ['all', state.organization])
  ])
  existingTags = tagsResponse.map((doc): {$id: string, name: string} => {
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
      }, [
        Permission.delete(Role.team(state.organization)),
        Permission.update(Role.team(state.organization)),
        Permission.read(Role.any()),
      ])
      tagIds.push(tagObj.$id)
    }
  }
  // Go through the publicTypes and create the new ones
  const publicTypesResponse = await $appwrite().getAllPages('kronikle', 'public-type', [
    Query.equal('author', ['all', state.organization])
  ])
  existingPublicTypes = publicTypesResponse.map((doc): {$id: string, name: string} => {
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
      }, [
        Permission.delete(Role.team(state.organization)),
        Permission.update(Role.team(state.organization)),
        Permission.read(Role.any()),
      ])
      publicTypesIds.push(obj.$id)
    }
  }
  // Go through the eventTypes and create the new ones
  const eventTypesResponse = await $appwrite().getAllPages('kronikle', 'event-type', [
    Query.equal('author', ['all', state.organization])
  ])
  existingEventTypes = eventTypesResponse.map((doc): {$id: string, name: string} => {
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
      }, [
        Permission.delete(Role.team(state.organization)),
        Permission.update(Role.team(state.organization)),
        Permission.read(Role.any()),
      ])
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
  }, [
    Permission.delete(Role.team(state.organization)),
    Permission.update(Role.team(state.organization)),
    Permission.read(Role.any()),
  ])
  // Create the Dates with the correct eventId
  let datesPromises = [] as Array<Promise<any>>
  for (const d of event.dates) {
    d.eventId = eventObj.$id
    datesPromises.push(databases.createDocument('kronikle', 'date', 'unique()', d as any, [
      Permission.delete(Role.team(state.organization)),
      Permission.update(Role.team(state.organization)),
      Permission.read(Role.any()),
    ]))
  }
  // Redirect to /event/:eventId
  Promise.all(datesPromises).then(() => {
    state.importing = false
    console.log('import OK')
    navigateTo('/event/' + eventObj.$id)
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
    <div class="my-4" v-if="pending">Chargement...</div>
    <div 
      @click="state.importedEventsIds.includes(event.id) ? null : importEvent(event.id)"
      v-for="event of events"
      :key="event.id"
      class="my-3 bg-white card shadow py-2 px-4 cursor-pointer hover:shadow-lg flex flex-row justify-between items-center"
      :class="{'bg-base-100': pending, 'text-base-200': pending}">
      <div>
        <div class="font-bold">{{event.name}}</div>
        <div v-for="date of event.date" :key="date" class="text-sm">{{(new Date(date)).toLocaleDateString()}}</div>
      </div>
      <div v-if="state.importedEventsIds.includes(event.id)" class="shrink-0">{{$t('event.import.already-imported')}}</div>
    </div>
    <!-- Put this part before </body> tag -->
    <input type="checkbox" id="my-modal" class="modal-toggle" v-model="state.importing" />
    <div class="modal">
      <div class="modal-box">
        <p class="py-4">{{$t('event.import.importing')}}</p>
      </div>
    </div>
  </div>
</template>