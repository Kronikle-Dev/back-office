<script lang="ts" setup>
import { Databases, Query, Teams, Permission, Role } from 'appwrite'
const {$appwrite} = useNuxtApp()

const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
const organization = myTeams.teams[0]?.$id ?? ''

let showTutorial = ref(false)
let isTestEventCreating = ref(false)

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

const events = ref<KEvent[]>([])
const dates = ref<KDateApi[]>([])

const eventQueries = () => [
  Query.equal('organization', organization),
  Query.notEqual('status', 'archived'),
  Query.orderDesc('$createdAt'),
]

async function fetchEvents() {
  events.value = (await $appwrite().getAllPages('kronikle', 'event', eventQueries())) as unknown as KEvent[]
}

// Appwrite limite le nombre de valeurs d'un `Query.equal` : on découpe par lots de 100.
async function fetchDates() {
  const ids = events.value.map(e => e.$id as string)
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
  const pages = await Promise.all(chunks.map(chunk =>
    $appwrite().getAllPages('kronikle', 'date', [Query.equal('eventId', chunk)])))
  dates.value = pages.flat() as unknown as KDateApi[]
}

await fetchEvents()
await fetchDates()

onMounted(async () => {
  if(typeof Storage !== 'undefined') {
    if (localStorage.getItem('tutorial') === 'true') {
      showTutorial.value = true
      localStorage.removeItem('tutorial')
    }
  }
})

// Séances avec leur événement, triées par date de début.
const augmentedDates = computed<KDateApiAug[]>(() =>
  dates.value
    .map(d => ({ ...d, event: events.value.find(e => e.$id === d.eventId) ?? null }))
    .filter(d => d.event !== null)
    .sort((a, b) => Date.parse(a.startDateTime) - Date.parse(b.startDateTime)))

const upcomingSessions = computed(() =>
  augmentedDates.value.filter(d => Date.parse(d.startDateTime) >= Date.now()).slice(0, 5))

$appwrite().client.subscribe(['databases.kronikle.collections.event.documents'], async () => {
  await fetchEvents()
  await fetchDates()
})

$appwrite().client.subscribe(['databases.kronikle.collections.date.documents'], async () => {
  await fetchDates()
})

// Mise à jour locale après un glisser-déposer réussi dans le calendrier.
function onSessionUpdated(p: { id: string, startDateTime: string, endDateTime: string }) {
  const d = dates.value.find(x => x.$id === p.id)
  if (d) Object.assign(d, { startDateTime: p.startDateTime, endDateTime: p.endDateTime })
}

const errorMessage = ref('')
function onCalendarError(message: string) {
  errorMessage.value = message
  setTimeout(() => { errorMessage.value = '' }, 5000)
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
  <div class="max-w-5xl mx-auto prose">
    <h2>{{$t('event.index.title')}}</h2>
    <div class="flex flex-row justify-between">
      <p>{{$t('event.index.subtitle')}} </p><nuxt-link to="/event/new" class="btn btn-primary">{{ $t('event.index.create-event') }}</nuxt-link>
    </div>
    <UpcomingSessions :sessions="upcomingSessions" />
    <h3 class="not-prose text-xl font-bold mb-3">{{ $t('event.index.calendar.title') }}</h3>
    <HomeCalendar :sessions="augmentedDates" @updated="onSessionUpdated" @error="onCalendarError" />
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
    <div v-if="errorMessage" class="toast toast-end z-50">
      <div class="alert alert-error"><span>{{ errorMessage }}</span></div>
    </div>
  </div>
</template>
