<script lang="ts" setup>
import { Databases, Query, Teams, Permission, Role } from 'appwrite'
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

let organization = ''
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
if (myTeams.teams.length === 0) {
  organization = ''
}
const myTeamId = myTeams.teams[0].$id
organization = myTeamId

let showDate = ref(new Date())
let showTutorial = ref(false)
let isTestEventCreating = ref(false)

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

const events = ref([] as KEvent[])

events.value = (await $appwrite().getAllPages('kronikle', 'event', [
  Query.equal('organization', organization),
  Query.notEqual('status', 'archived')
])) as unknown as KEvent[]

let dates = [] as KDateApi[]
if (events.value.length > 0) {
  dates.push(... await $appwrite().getAllPages('kronikle', 'date', [
    Query.equal('eventId', events.value.map(ev => ev.$id as string))
  ]) as unknown as KDateApi[])
}

onMounted(async () => {
  if(typeof Storage !== 'undefined') {
    if (localStorage.getItem('tutorial') === 'true') {
      showTutorial.value = true
      localStorage.removeItem('tutorial')
    }
  }
})

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

async function createTestEvent () {
  const newevent = {
    name: 'Test de Kronikle',
    description: 'Kronikle vous permet de gérer votre agenda, d\'enrichir vos événements avec des ressources documentaires de votre choix et de publier le tout en ligne et sur des affichages publics.',
    creationDate: new Date().toISOString(),
    updateDate: new Date().toISOString(),
    status: 'published',
    author: 'Kronikle',
    originId: '',
    imageId: '',
    imageUrl: null,
    price: null,
    url: null,
    tags: [],
    publicTypes: [],
    eventType: [],
    organization: organization
  }

  const d = {
    eventId: '',
    status: 'valid',
    startDateTime: new Date((new Date()).setMinutes(0)),
    endDateTime: new Date((new Date((new Date()).setTime((new Date()).getTime() + 3600000))).setMinutes(0)),
    placeName: 'Salle bleue',
    placeDescription: 'Rez-de-chaussée, à droite',
    maxAttendeeCapacity: 30,
    mandatoryRegistration: false,
    accessibility: 'Accessible aux personnes à mobilité réduite',
    attendanceMode: 'offline'
  }
  let datesPromises = [] as Array<Promise<any>>

  newevent.creationDate = new Date().toISOString()
  newevent.updateDate = new Date().toISOString()

  const databases = new Databases($appwrite().client)
  isTestEventCreating.value = true
  const inserted = await databases.createDocument('kronikle', 'event', 'unique()', newevent, [
    Permission.delete(Role.team(newevent.organization)),
    Permission.update(Role.team(newevent.organization)),
    Permission.read(Role.any()),
  ])

  d.eventId = inserted.$id
  datesPromises.push(databases.createDocument('kronikle', 'date', 'unique()', d, [
    Permission.delete(Role.team(newevent.organization)),
    Permission.update(Role.team(newevent.organization)),
    Permission.read(Role.any()),
  ]))

  Promise.all(datesPromises).then(() => {
    isTestEventCreating.value = false
    localStorage.setItem('event-tutorial', 'true')
    navigateTo(`/event/${inserted.$id}`)
  })
}

</script>

<template>
  <div class="max-w-[50rem] mx-auto prose">
    <h2>{{$t('event.index.title')}}</h2>
    <div class="flex flex-row justify-between">
      <p>{{$t('event.index.subtitle')}} </p><nuxt-link to="/event/new" class="btn btn-primary">{{ $t('event.index.create-event') }}</nuxt-link>
    </div>
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
    <dialog id="my_modal_2" class="modal" :class="{'modal-open': showTutorial}">
      <div class="modal-box">
        <h3 class="text-lg font-bold">{{ $t('tutorial.welcome.title') }}</h3>
        <p class="py-4">{{ $t('tutorial.welcome.text-1') }}</p>
        <p class="py-4">{{ $t('tutorial.welcome.text-2') }}</p>
        <p class="py-4">{{ $t('tutorial.welcome.text-3') }}</p>
        <div class="flex flex-col space-y-2">
          <button @click="showTutorial = false" class="btn btn-primary btn-outline">{{ $t('tutorial.welcome.close') }}</button>
          <a href="mailto:contact@kronikle.eu" class="btn btn-primary btn-outline">{{ $t('tutorial.welcome.button-discuss') }}</a>
          <nuxt-link to="/event/new" class="btn btn-primary">{{ $t('tutorial.welcome.button-create-event') }}</nuxt-link>
          <button @click="createTestEvent" class="btn btn-primary">
            <span v-if="isTestEventCreating" class="loading loading-spinner"></span>
            {{ $t('tutorial.welcome.button-create-test-event') }}
          </button>
        </div>
      </div>
    </dialog>
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
