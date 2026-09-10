<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
import {DateTime} from 'luxon'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
const displayid = route.params.displayid as string
const dateid = route.params.dateid as string
let display: KDisplay | null = null
let date: KDateApi | null = null
let event: KEvent | null = null

definePageMeta({
  layout: "display",
})

try {
  const [displayDoc, dateDoc] = await Promise.all([
    databases.getDocument('kronikle', 'display', displayid),
    databases.getDocument('kronikle', 'date', dateid),
  ])
  display = displayDoc as unknown as KDisplay
  date = dateDoc as unknown as KDateApi
  event = (await databases.getDocument('kronikle', 'event', date.eventId)) as unknown as KEvent
} catch (e) {
  console.error('Bad display/date/event id : ', displayid, dateid, e)
}

// Un `<script setup>` ne peut pas faire de `return` anticipé : on redirige puis
// on protège le chargement derrière un test pour ne plus lever d'exception (500).
const loaded = !!(display && date && event)
if (!loaded) {
  await navigateTo(`/d${route.params.qr ?? ''}/error`, { replace: true })
}

const qr = !!route.params.qr && (route.params.qr as string).length > 0

let eventIdList = null as unknown as Set<string>

let firstDayOfMonth = DateTime.fromObject({day: 1})
let lastDayOfMonth = DateTime.fromObject({day: firstDayOfMonth.daysInMonth, hour: 23, minute: 59})
let firstDayofWeek = DateTime.fromObject({weekday: 1})
let lastDayofWeek = DateTime.fromObject({weekday: 7, hour: 23, minute: 59})
let beginningOfToday = DateTime.fromObject({hour: 0})
let endOfToday = DateTime.fromObject({hour: 23, minute: 59, second: 59})

/*
const tagQueries = display.tagFilter.map(tagId => Query.search('tags', tagId))
const publicQueries = display.publicFilter.map(publicId => Query.search('publicTypes', publicId))
const typeQueries = display.typeFilter.map(typeId => Query.search('eventType', typeId))
*/
const events = ref([] as KEvent[])
const dates = ref([] as unknown as KDateApi[])


onMounted(async () => {
  if (!display || !date || !event) return
  const disp: KDisplay = display

  try {
    switch (disp.eventFilter) {
      case 'month':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.greaterThanEqual('startDateTime', firstDayOfMonth.toString()),
          Query.lessThanEqual('startDateTime', lastDayOfMonth.toString()),
          Query.orderDesc('$createdAt')
        ])).map((d) => d.eventId).slice(0, 100))
        break
      case 'week':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.greaterThanEqual('startDateTime', firstDayofWeek.toString()),
          Query.lessThanEqual('startDateTime', lastDayofWeek.toString()),
          Query.orderDesc('$createdAt')
        ])).map((d) => d.eventId).slice(0, 100))
        break
      case 'upcoming':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.greaterThanEqual('startDateTime', beginningOfToday.toString()),
          Query.orderDesc('$createdAt')
        ])).map((d) => d.eventId).slice(0, 100))
        break
      case 'past':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.lessThan('startDateTime', beginningOfToday.toString()),
          Query.orderDesc('$createdAt')
        ])).map((d) => d.eventId).slice(0, 100))
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
      events.value.push(...((await $appwrite().getAllPages('kronikle', 'event', queries )) as unknown[] as KEvent[]).filter(e => {
        if (disp.tagFilter.length == 0 && disp.publicFilter.length == 0 && disp.typeFilter.length == 0) {
          return true
        } else if (!disp.excludeFilters) {
          return e.tags?.some(t => disp.tagFilter.includes(t)) ||
            e.publicTypes?.some(p => disp.publicFilter.includes(p)) ||
            e.eventType?.some(t => disp.typeFilter.includes(t))
        } else {
          return !e.tags?.some(t => disp.tagFilter.includes(t)) &&
            !e.publicTypes?.some(p => disp.publicFilter.includes(p)) &&
            !e.eventType?.some(t => disp.typeFilter.includes(t))
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

  dates.value = (await $appwrite().getAllPages('kronikle', 'date', [Query.equal('eventId', events.value.map(ev => ev.$id as string))])) as unknown as KDateApi[]

})

</script>

<template>
  <div>
    <!--<TemplateBasicEvent v-if="qr || display.template === 'basic'" :events="events" :event="event"></TemplateBasicEvent>-->
    <TemplateExploreEvent v-if="loaded && display && display.template === 'explore-v3'" :events="events" :display="display" :dates="dates" :event="event" :date="date"></TemplateExploreEvent>
  </div>
</template>
