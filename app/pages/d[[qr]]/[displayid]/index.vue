<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
import {DateTime} from 'luxon'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
const displayid = route.params.displayid as string
let display: KDisplay | null = null

definePageMeta({
  layout: "display",
})

try {
  display = (await databases.getDocument('kronikle', 'display', displayid)) as unknown as KDisplay
} catch (e) {
  console.error('Bad display id : ', displayid, e)
}

// Un `<script setup>` ne peut pas faire de `return` anticipé : on redirige puis
// on protège tout le chargement derrière `if (display)` pour ne plus lever
// d'exception (500) après la redirection.
if (!display) {
  await navigateTo(`/d${route.params.qr ?? ''}/error`, { replace: true })
}

const qr = !!route.params.qr && (route.params.qr as string).length > 0

const events = ref([] as KEvent[])
const dates = [] as KDateApi[]

if (display) {
const disp: KDisplay = display
let eventIdList = null as unknown as Set<string>

let firstDayOfMonth = DateTime.fromObject({day: 1})
let lastDayOfMonth = DateTime.fromObject({day: firstDayOfMonth.daysInMonth, hour: 23, minute: 59})
let firstDayofWeek = DateTime.fromObject({weekday: 1})
let lastDayofWeek = DateTime.fromObject({weekday: 7, hour: 23, minute: 59})
let beginningOfToday = DateTime.fromObject({hour: 0})
let endOfToday = DateTime.fromObject({hour: 23, minute: 59, second: 59})

try {
  switch (disp.eventFilter) {
    case 'month':
      eventIdList = new Set((await databases.listDocuments('kronikle', 'date', [
        Query.greaterThanEqual('startDateTime', firstDayOfMonth.toISO() as string),
        Query.lessThanEqual('startDateTime', lastDayOfMonth.toISO() as string),
        Query.orderDesc('$createdAt')
      ])).documents.map((d) => d.eventId).slice(0, 100))
      break
    case 'week':
      eventIdList = new Set((await databases.listDocuments('kronikle', 'date', [
        Query.greaterThanEqual('startDateTime', firstDayofWeek.toString()),
        Query.lessThanEqual('startDateTime', lastDayofWeek.toISO() as string),
        Query.orderDesc('$createdAt')
      ])).documents.map(d => d.eventId).slice(0, 100))
      break
    case 'upcoming':
      eventIdList = new Set((await databases.listDocuments('kronikle', 'date', [
        Query.greaterThanEqual('endDateTime', beginningOfToday.toISO() as string),
        Query.orderDesc('$createdAt')
      ])).documents.map(d => d.eventId).slice(0, 100))
      break
    case 'past':
      eventIdList = new Set((await databases.listDocuments('kronikle', 'date', [
        Query.lessThan('startDateTime', beginningOfToday.toISO() as string),
        ...expirationDateQueries(disp),
        Query.orderDesc('$createdAt')
      ])).documents.map(d => d.eventId).slice(0, 100))
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

/* 
There is NO Contain query in Appwrite, so we have to do it manually (https://discord.com/channels/564160730845151244/564161855862603789/1060730532574548071)
const tagQueries = disp.tagFilter.map(tagId => Query.search('tags', tagId))
const publicQueries = disp.publicFilter.map(publicId => Query.search('publicTypes', publicId))
const typeQueries = disp.typeFilter.map(typeId => Query.search('eventType', typeId))
*/

const queries = [
  Query.equal('organization', disp.organization),
  Query.notEqual('status', 'archived'),
  /*
  ...tagQueries,
  ...publicQueries,
  ...typeQueries
  */
]

if (eventIdList && eventIdList.size > 0) {
  queries.push(Query.equal('$id', new Array(...eventIdList)))
}

if (disp.eventFilter != 'none') {
  try {
    const apievents = await $appwrite().getAllPages('kronikle', 'event', queries )
    events.value.push(...(apievents as unknown[] as KEvent[]).filter(e => {
      if (disp.tagFilter.length == 0 && disp.publicFilter.length == 0 && disp.typeFilter.length == 0) {
        return true
      } else if (!disp.excludeFilters) {
        return (e.tags ?? []).some(t => disp.tagFilter.includes(t)) ||
          (e.publicTypes ?? []).some(p => disp.publicFilter.includes(p)) ||
          (e.eventType ?? []).some(t => disp.typeFilter.includes(t))
      } else {
        return !(e.tags ?? []).some(t => disp.tagFilter.includes(t)) &&
          !(e.publicTypes ?? []).some(p => disp.publicFilter.includes(p)) &&
          !(e.eventType ?? []).some(t => disp.typeFilter.includes(t))
      }
    }))
  } catch (e) {
    console.error('Failed to retrieve events from filter : ', e)
  }
}

// Si la eventIdList est null, c'est que c'est `all` qui est choisi et on a tous les événements, pas la pein d'en rajouter
if (eventIdList != null && eventIdList.size > 0) {
  const supplementaryEventIds = disp.events.filter(e => !eventIdList.has(e))
  if (supplementaryEventIds.length > 0) {
    try {
      events.value.push( ... (await $appwrite().getAllPages('kronikle', 'event', [
        Query.equal('$id', supplementaryEventIds),
        Query.equal('organization', disp.organization),
        Query.notEqual('status', 'archived')
      ])) as unknown[] as KEvent[])
    } catch (e) {
      console.error('Failed to retrieve supplementray events : ', e)
    }
  }
}

console.log(JSON.stringify(events.value.map(ev => ev.$id as string)))

if (events.value.length > 0) {
  dates.push(... await $appwrite().getAllPages('kronikle', 'date', [
    Query.equal('eventId', events.value.map(ev => ev.$id as string)),
    ...expirationDateQueries(disp)
  ]) as unknown as KDateApi[])
  // Un événement dont toutes les séances sont périmées disparaît (cartes et
  // panneau des thèmes, qui se construit à partir de `events`).
  if (eventExpirationCutoff(disp)) {
    events.value = events.value.filter(ev => dates.some(d => d.eventId === ev.$id))
  }
}
}

</script>

<template>
  <div>
    <!--<<TemplateBasic v-if="qr || display.template === 'basic'" :events="events"></TemplateBasic>-->
    <TemplateExploreHome v-if="display && display.template === 'explore-v3'" :events="events" :display="display" :dates="dates"></TemplateExploreHome>
  </div>
</template>
