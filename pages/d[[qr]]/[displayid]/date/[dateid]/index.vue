<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
import {DateTime} from 'luxon'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
const displayid = route.params.displayid as string
const dateid = route.params.dateid as string
let display = null as unknown as KDisplay
let date = null as unknown as KDateApi
let event = null as unknown as KEvent

definePageMeta({
  layout: "display",
})

const displayPromise = databases.getDocument('kronikle', 'display', displayid)

const datePromise = databases.getDocument('kronikle', 'date', dateid)

try {
  display = (await displayPromise) as unknown as KDisplay
  date = (await datePromise) as unknown as KDateApi
} catch (e) {
  console.error('Bad id : ', e)
  navigateTo(`/d${route.params.qr}/error`)
}

try {
  event = (await databases.getDocument('kronikle', 'event', date.eventId)) as unknown as KEvent
} catch (e) {
  console.error('Bad event id : ', date.eventId, e)
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

/*
const tagQueries = display.tagFilter.map(tagId => Query.search('tags', tagId))
const publicQueries = display.publicFilter.map(publicId => Query.search('publicTypes', publicId))
const typeQueries = display.typeFilter.map(typeId => Query.search('eventType', typeId))
*/
const events = ref([] as KEvent[])
const dates = ref([] as unknown as KDateApi[])


onMounted(async () => {

  try {
    switch (display.eventFilter) {
      case 'month':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.greaterThanEqual('startDateTime', firstDayOfMonth.toString()),
          Query.lessThanEqual('startDateTime', lastDayOfMonth.toString())
        ])).map((d: {eventId: string}) => d.eventId))
        break
      case 'week':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.greaterThanEqual('startDateTime', firstDayofWeek.toString()),
          Query.lessThanEqual('startDateTime', lastDayofWeek.toString())
        ])).map((d: {eventId: string}) => d.eventId))
        break
      case 'upcoming':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.greaterThanEqual('startDateTime', beginningOfToday.toString()),
        ])).map((d: {eventId: string}) => d.eventId))
        break
      case 'past':
        eventIdList = new Set((await $appwrite().getAllPages('kronikle', 'date', [
          Query.lessThan('startDateTime', beginningOfToday.toString())
        ])).map((d: {eventId: string}) => d.eventId))
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
    Query.equal('organization', display.organization)
    /*
    ...tagQueries,
    ...publicQueries,
    ...typeQueries
    */
  ]

  if (eventIdList) {
    queries.push(Query.equal('$id', new Array(...eventIdList)))
  }

  if (display.eventFilter != 'none') {
    try {
      events.value.push(...((await $appwrite().getAllPages('kronikle', 'event', queries )) as unknown[] as KEvent[]).filter(e => {
        if (display.tagFilter.length == 0 && display.publicFilter.length == 0 && display.typeFilter.length == 0) {
          return true
        } else if (!display.excludeFilters) {
          return e.tags?.some(t => display.tagFilter.includes(t)) ||
            e.publicTypes?.some(p => display.publicFilter.includes(p)) ||
            e.eventType?.some(t => display.typeFilter.includes(t))
        } else {
          return !e.tags?.some(t => display.tagFilter.includes(t)) &&
            !e.publicTypes?.some(p => display.publicFilter.includes(p)) &&
            !e.eventType?.some(t => display.typeFilter.includes(t))
        }
      }))
    } catch (e) {
      console.error('Failed to retrieve events from filter : ', e)
    }
  }

  // Si la eventIdList est null, c'est que c'est `all` qui est choisi et on a tous les événements, pas la pein d'en rajouter
  if (eventIdList != null) {
    const supplementaryEventIds = display.events.filter(e => !eventIdList.has(e))

    try {
      events.value.push( ... (await $appwrite().getAllPages('kronikle', 'event', [
        Query.equal('$id', supplementaryEventIds),
        Query.equal('organization', display.organization)
      ])) as unknown[] as KEvent[])
    } catch (e) {
      console.error('Failed to retrieve supplementray events : ', e)
    }
  }

  dates.value = (await $appwrite().getAllPages('kronikle', 'date', [Query.equal('eventId', events.value.map(ev => ev.$id as string))])) as unknown as KDateApi[]

})

</script>

<template>
  <div>
    <!--<TemplateBasicEvent v-if="qr || display.template === 'basic'" :events="events" :event="event"></TemplateBasicEvent>-->
    <TemplateExploreEvent v-if="display.template === 'explore-v3'" :events="events" :display="display" :dates="dates" :event="event" :date="date"></TemplateExploreEvent>
  </div>
</template>
