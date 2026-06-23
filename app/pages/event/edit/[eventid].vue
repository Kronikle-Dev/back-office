<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
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

const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization

let event: KEvent
try {
  event = (await databases.getDocument('kronikle', 'event', eventid)) as unknown as KEvent
  if (event.organization != organization) {
    throw new Error("bad organization")
  }
} catch (e) {
  console.error('Bad event id : ', eventid, e)
  navigateTo('/')
}

const dates = (await $appwrite().getAllPages('kronikle', 'date', [
  Query.equal('eventId', event.$id as string)
])) as unknown as KDate[]

store.initFromExisting(event!, dates)
</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <EventNewContainer />
  </div>
</template>

<style scoped></style>
