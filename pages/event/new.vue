<script lang="ts" setup>
import { Databases, Teams, Permission, Role } from 'appwrite'
const {$appwrite} = useNuxtApp()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const newevent = reactive({
  name: '',
  description: '',
  creationDate: '',
  updateDate: '',
  status: 'published',
  author: '',
  originId: '',
  imageId: '',
  imageUrl: null,
  price: null,
  url: null,
  tags: [],
  publicTypes: [],
  eventType: [],
  organization: ''
})

const dates = ref([] as Array<any>)

onBeforeMount (async () => {
  const teams = new Teams($appwrite().client)
  const myTeams = await teams.list()
  if (myTeams.teams.length === 0) {
    return
  }
  const myTeamId = myTeams.teams[0].$id
  newevent.organization = myTeamId
})

function assignFragment(fragment:any) {
  Object.assign(newevent, fragment)
}

function assignDateFragment(fragment:Array<any>) {
  dates.value = fragment
}

async function publish () {
  console.log(newevent)
  console.log(dates.value)

  let datesPromises = [] as Array<Promise<any>>

  newevent.creationDate = new Date().toISOString()
  newevent.updateDate = new Date().toISOString()

  const databases = new Databases($appwrite().client)
  const inserted = await databases.createDocument('kronikle', 'event', 'unique()', newevent, [
    Permission.delete(Role.team(newevent.organization)),
    Permission.update(Role.team(newevent.organization)),
    Permission.read(Role.any()),
  ])
  for (const d of dates.value) {
    if (d.new) {
      d.eventId = inserted.$id
      delete d['$id']
      delete d['new']
      datesPromises.push(databases.createDocument('kronikle', 'date', 'unique()', d, [
        Permission.delete(Role.team(newevent.organization)),
        Permission.update(Role.team(newevent.organization)),
        Permission.read(Role.any()),
      ]))
    }
  }

  Promise.all(datesPromises).then(() => {
    console.log('done')
    navigateTo('/')
  })
}

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <EventNewContainer
      @fragment="assignFragment"
      @datefragment="assignDateFragment"
      @publish="publish"
      :event="newevent"
      :dates="dates">
    </EventNewContainer>
  </div>
</template>

<style scoped></style>
