<script lang="ts" setup>
import { Databases } from 'appwrite'
const {$appwrite} = useNuxtApp()
const route = useRoute()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const eventid = route.params.eventid as string
const databases = new Databases($appwrite().client)
let event = null as unknown as KEvent

const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization

try {
  event = (await databases.getDocument('kronikle', 'event', eventid)) as unknown as KEvent
  if (event.organization != organization) {
    throw new Error("bad organization");
  }
} catch (e) {
  console.error('Bad event id : ', eventid, e)
  navigateTo('/')
}
</script>

<template>
  <div>
    <div class="flex flex-col lg:flex-row space-x-4">
      <EventData :event="event"  :editButton="true"></EventData>
      <RessourceForm :event="event"></RessourceForm>
    </div>
    <RessourceGrid :event="event" class="mt-4"></RessourceGrid>
  </div>
</template>