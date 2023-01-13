<script lang="ts" setup>
import Appwrite from '~~/utils/appwrite'
import { Databases, Query } from 'appwrite'

const databases = new Databases(Appwrite.client)
const prefs = await Appwrite.account.getPrefs()
const organization = prefs.organization

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

const events = ref([] as KEvent[])

events.value = (await databases.listDocuments('kronikle', 'event', [
  Query.equal('organization', organization)
])).documents as unknown as KEvent[]

Appwrite.client.subscribe(['databases.kronikle.collections.event.documents'], async response => {
  events.value = (await databases.listDocuments('kronikle', 'event', [
    Query.equal('organization', organization)
  ])).documents as unknown as KEvent[]
})

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{$t('event.index.title')}}</h2>
    <p>{{$t('event.index.subtitle')}}</p>
    <NuxtLink
        v-for="event of events"
        :key="event.$id"
        :to="`/admin/event/${event.$id}`">
      <div
        class="my-3 bg-white card shadow py-2 px-4 cursor-pointer hover:shadow-lg flex flex-row space-x-2 not-prose">
        <div class="avatar">
          <div class="w-24 rounded">
            <img :src="event.imageUrl" />
          </div>
        </div>
        <div class="font-bold">{{event.name}}</div>
      </div>
    </NuxtLink>
  </div>
</template>

<style scoped></style>
