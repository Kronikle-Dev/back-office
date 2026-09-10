<script lang="ts" setup>
import { Databases, Query, Teams } from 'appwrite'
import { useEventDraftStore } from '@/stores/eventDraft'

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const store = useEventDraftStore()
const route = useRoute()
const { $appwrite } = useNuxtApp()

const eventid = route.params.eventid as string
const databases = new Databases($appwrite().client)

// Events store the team id in `organization`, so validate against the user's
// team (like the detail/profile pages) — prefs.organization is never set.
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
const organization = myTeams.teams[0]?.$id

let ready = false
try {
  const event = (await databases.getDocument('kronikle', 'event', eventid)) as unknown as KEvent
  if (event.organization != organization) {
    throw new Error("bad organization")
  }
  const dates = (await $appwrite().getAllPages('kronikle', 'date', [
    Query.equal('eventId', eventid)
  ])) as unknown as KDate[]
  store.initFromExisting(event, dates)
  ready = true
} catch (e) {
  console.error('Bad event id : ', eventid, e)
  await navigateTo('/')
}
</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <EventNewContainer v-if="ready" />
  </div>
</template>

<style scoped></style>
