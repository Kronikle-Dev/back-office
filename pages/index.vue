<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
const {$appwrite} = useNuxtApp()

const databases = new Databases($appwrite().client)
const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

const events = ref([] as KEvent[])

events.value = (await $appwrite().getAllPages('kronikle', 'event', [
  Query.equal('organization', organization)
])) as unknown as KEvent[]

$appwrite().client.subscribe(['databases.kronikle.collections.event.documents'], async () => {
  events.value = (await $appwrite().getAllPages('kronikle', 'event', [
    Query.equal('organization', organization)
  ])) as unknown as KEvent[]
})

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{$t('event.index.title')}}</h2>
    <p>{{$t('event.index.subtitle')}}</p>
    <NuxtLink
        v-for="event of events"
        :key="event.$id"
        :to="`/event/${event.$id}`">
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
