<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
import {DateTime} from 'luxon'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
const displayid = route.params.displayid as string
let display = null as unknown as KDisplay

definePageMeta({
  layout: "display",
})

try {
  display = (await databases.getDocument('kronikle', 'display', displayid)) as unknown as KDisplay
} catch (e) {
  console.error('Bad display id : ', displayid, e)
  navigateTo(`/d${route.params.qr}/error`)
}

const qr = route.params.qr.length > 0

let eventIdList = null as unknown as Set<string>

let firstDayOfMonth = DateTime.fromObject({day: 1})
let lastDayOfMonth = DateTime.fromObject({day: firstDayOfMonth.daysInMonth, hour: 23, minute: 59})
let firstDayofWeek = DateTime.fromObject({weekday: 1})
let lastDayofWeek = DateTime.fromObject({weekday: 7, hour: 23, minute: 59})
let beginningOfToday = DateTime.fromObject({hour: 0})
let endOfToday = DateTime.fromObject({hour: 23, minute: 59, second: 59})

try {
  switch (display.eventFilter) {
    case 'month':
      eventIdList = new Set((await databases.listDocuments('kronikle', 'date', [
        Query.greaterThanEqual('startDateTime', firstDayOfMonth.toString()),
        Query.lessThanEqual('startDateTime', lastDayOfMonth.toString())
      ])).documents.map((d) => d.eventId))
      break
    case 'week':
      eventIdList = new Set((await databases.listDocuments('kronile', 'date', [
        Query.greaterThanEqual('startDateTime', firstDayofWeek.toString()),
        Query.lessThanEqual('startDateTime', lastDayofWeek.toString())
      ])).documents.map(d => d.eventId))
      break
    case 'upcoming':
      eventIdList = new Set((await databases.listDocuments('kronile', 'date', [
        Query.greaterThanEqual('startDateTime', beginningOfToday.toString()),
      ])).documents.map(d => d.eventId))
      break
    case 'past':
      eventIdList = new Set((await databases.listDocuments('kronile', 'date', [
        Query.lessThan('startDateTime', beginningOfToday.toString())
      ])).documents.map(d => d.eventId))
      break
    case 'none':
      eventIdList = new Set()
      break
    case 'all':
      break
    default:
      break
  }
} catch (e) {
  console.error('Failed to retrieve eventIdList : ', e)
}

const tagQueries = display.tagFilter.map(tagId => Query.search('tags', tagId))
const publicQueries = display.publicFilter.map(publicId => Query.search('publicTypes', publicId))
const typeQueries = display.typeFilter.map(typeId => Query.search('eventType', typeId))

const events = ref([] as KEvent[])

const queries = [
  ...tagQueries,
  ...publicQueries,
  ...typeQueries
]

if (eventIdList) {
  queries.push(Query.equal('$id', new Array(...eventIdList)))
}

if (display.eventFilter != 'none') {
  try {
    events.value.push(...(await databases.listDocuments('kronikle', 'event', queries )).documents as unknown[] as KEvent[])
  } catch (e) {
    console.error('Failed to retrieve events from filter : ', e)
  }
}

// Si la eventIdList est null, c'est que c'est `all` qui est choisi et on a tous les événements, pas la pein d'en rajouter
if (eventIdList != null) {
  const supplementaryEventIds = display.events.filter(e => !eventIdList.has(e))

  try {
    events.value.push( ... (await databases.listDocuments('kronikle', 'event', [
      Query.equal('$id', supplementaryEventIds)
    ])).documents as unknown[] as KEvent[])
  } catch (e) {
    console.error('Failed to retrieve supplementray events : ', e)
  }
}

const dates = (await databases.listDocuments('kronikle', 'date', [Query.equal('eventId', events.value.map(ev => ev.$id as string))])).documents as unknown as KDate[]

</script>

<template>
  <div>
    <TemplateBasic v-if="qr || display.template === 'basic'" :events="events"></TemplateBasic>
    <TemplateExploreHome v-if="!qr && display.template === 'explore-v3'" :events="events" :display="display" :dates="dates"></TemplateExploreHome>
  </div>
</template>
