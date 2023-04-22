<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
import { CalendarView, CalendarViewHeader } from "vue-simple-calendar"
import "~~/node_modules/vue-simple-calendar/dist/style.css"
import "~~/node_modules/vue-simple-calendar/dist/css/default.css"
const {$appwrite} = useNuxtApp()

defineComponent({
  components: {
    CalendarView,
    CalendarViewHeader
  }
})

const databases = new Databases($appwrite().client)
const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization

let showDate = ref(new Date())

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

const events = ref([] as KEvent[])

events.value = (await $appwrite().getAllPages('kronikle', 'event', [
  Query.equal('organization', organization)
])) as unknown as KEvent[]

let dates = [] as KDateApi[]
if (events.value.length > 0) {
  dates.push(... await $appwrite().getAllPages('kronikle', 'date', [
    Query.equal('eventId', events.value.map(ev => ev.$id as string))
  ]) as unknown as KDateApi[])
}

function getEventForDate (date: KDateApi) : KEvent  | null {
  return events.value.find((e) => e.$id == date.eventId) || null
}

const augmentedDates = computed(() => {
 return dates.sort((a, b) => {
    return (new Date(a.startDateTime)).getTime() - (new Date(b.startDateTime)).getTime()
  }).map((d) => {
    (d as KDateApiAug).event = getEventForDate(d)
    if (d != null) {
      return d
    } else {
      return
    }
  }) as KDateApiAug[]
})


$appwrite().client.subscribe(['databases.kronikle.collections.event.documents'], async () => {
  events.value = (await $appwrite().getAllPages('kronikle', 'event', [
    Query.equal('organization', organization)
  ])) as unknown as KEvent[]
})

$appwrite().client.subscribe(['databases.kronikle.collections.date.documents'], async () => {
  dates = []
  dates.push(... await $appwrite().getAllPages('kronikle', 'date', [
    Query.equal('eventId', events.value.map(ev => ev.$id as string))
  ]) as unknown as KDateApi[])
})

function setShowDate(d: Date) {
  console.log(d)
  showDate.value = d;
}

const eventItems = computed(() => {
  return augmentedDates.value.map((date) => {
    return {
      id: date.$id,
      startDate: new Date(date.startDateTime),
      endDate: new Date(date.endDateTime),
      title: date.event?.name,
      url: `/event/${date.event?.$id}`,
      classes: ["cursor-pointer"]
    }
  })
})

function navigateToEvent (simpleCalendarEvent: any) {
  console.log(simpleCalendarEvent)
  navigateTo(simpleCalendarEvent.url)
}

</script>

<template>
  <div class="max-w-[50rem] mx-auto prose">
    <h2>{{$t('event.index.title')}}</h2>
    <p>{{$t('event.index.subtitle')}}</p>
    <div class="my-3 flex flex-col grow">
      <CalendarView
        class="theme-default card shadow rounded-lg"
        :startingDayOfWeek="1"
        :items="eventItems"
        @click-item="navigateToEvent"
        :show-date="showDate">
        <template #header="{ headerProps }">
          <calendar-view-header
            :header-props="headerProps"
            @input="setShowDate" />
        </template>
      </CalendarView>
    </div>
    <!--
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
    -->
  </div>
</template>

<style>
.cv-week {
  min-height: 6em;
}
</style>
