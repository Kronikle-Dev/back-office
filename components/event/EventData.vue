<script lang="ts" setup>
import Appwrite from '~~/utils/appwrite'
import { Databases, Query } from 'appwrite'
import { DateTimeFormatOptions } from '@intlify/core-base';

const databases = new Databases(Appwrite.client)

const props = defineProps<{
  event: KEvent,
  editButton: boolean
}>()

if (!props.event.$id) {
  throw new Error('Missing event id');
}

const dates = (await databases.listDocuments('kronikle', 'date', [
  Query.equal('eventId', props.event.$id)
])).documents as unknown as KDate[]

const orderedDates = computed(() => {
  return dates.sort((a: any, b: any) => {
    return a.startDateTime - b.startDateTime
  })
})
const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' } as DateTimeFormatOptions
const timeOptions = { hour: 'numeric', minute: 'numeric' } as DateTimeFormatOptions
</script>

<template>
  <div class="max-w-xl ml-4">
    <div class="card bg-white not-prose shadow">
      <NuxtLink :to="`/event/edit/${props.event.$id}`">
        <div class="btn btn-primary">{{$t('event.card.edit')}}</div>
      </NuxtLink>
      <figure><img :src="props.event.imageUrl" alt="Event image" /></figure>
      <div class="card-body">
        <h2 class="card-title">{{props.event.name}}</h2>
        <div v-html="props.event.description"></div>
        <!--
        <div>
          <span v-for="tag of props.event.tags" :key="tag">{{availableTags.find((t) => t.$id === tag)?.name}} </span>
        </div>-->
        <div class="grid sm:grid-cols-2 gap-y-8 grid-cols-1 mb-10">
        <div v-for="date of orderedDates" :key="`${date.$id}`" class="indicator">
          <div class="card w-64 bg-white shadow not-prose">
            <div class="card-body">
              <h2 class="card-title">{{new Date(date.startDateTime).toLocaleDateString(undefined, dateOptions)}} ({{new Date(date.startDateTime).toLocaleTimeString(undefined, timeOptions)}})</h2>
              <p>{{date.placeName}}, {{date.placeDescription}}.<br/>{{new Date(date.endDateTime).toLocaleDateString(undefined, dateOptions)}} ({{new Date(date.endDateTime).toLocaleTimeString(undefined, timeOptions)}})</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>