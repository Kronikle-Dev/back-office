<script lang="ts" setup>
import { Databases, Teams } from 'appwrite'
const {$appwrite} = useNuxtApp()
const route = useRoute()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const eventid = route.params.eventid as string
const databases = new Databases($appwrite().client)
let event = null as unknown as KEvent

let organization = ''
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
if (myTeams.teams.length === 0) {
  organization = ''
}
const myTeamId = myTeams.teams[0].$id
organization = myTeamId

const showTutorial = ref(false)

try {
  event = (await databases.getDocument('kronikle', 'event', eventid)) as unknown as KEvent
  if (event.organization != organization) {
    throw new Error("bad organization");
  }
} catch (e) {
  console.error('Bad event id : ', eventid, e)
  navigateTo('/')
}

onMounted(async () => {
  if(typeof Storage !== 'undefined') {
    if (localStorage.getItem('event-tutorial') === 'true') {
      showTutorial.value = true
      localStorage.removeItem('event-tutorial')
    }
  }
})
</script>

<template>
  <div>
    <div class="flex flex-col lg:flex-row space-x-4">
      <EventData :event="event"  :editButton="true"></EventData>
      <RessourceForm :event="event"></RessourceForm>
    </div>
    <RessourceGrid :event="event" class="mt-4"></RessourceGrid>
    <dialog id="my_modal_2" class="modal" :class="{'modal-open': showTutorial}">
      <div class="modal-box">
        <h3 class="text-lg font-bold">{{ $t('tutorial.event.title') }}</h3>
        <p class="py-4">{{ $t('tutorial.event.text-1') }}</p>
        <p class="py-4">{{ $t('tutorial.event.text-2') }}</p>
        <p class="py-4">{{ $t('tutorial.event.text-3') }}</p>
        <p class="py-4">{{ $t('tutorial.event.text-4') }}</p>
        <div class="flex flex-col space-y-2">
          <button @click="showTutorial = false" class="btn btn-primary btn-outline">{{ $t('tutorial.event.close') }}</button>
          <nuxt-link to="/display/new" class="btn btn-primary">{{ $t('tutorial.event.button-create-display') }}</nuxt-link>
        </div>
      </div>
    </dialog>
  </div>
</template>