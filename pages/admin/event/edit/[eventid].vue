<script lang="ts" setup>
import Appwrite from '@/utils/appwrite'
import { Databases, Query } from 'appwrite'
const route = useRoute()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const eventid = route.params.eventid as string
const databases = new Databases(Appwrite.client)
let event = null as unknown as KEvent

const prefs = await Appwrite.account.getPrefs()
const organization = prefs.organization

try {
  event = (await databases.getDocument('kronikle', 'event', eventid)) as unknown as KEvent
  if (event.organization != organization) {
    throw new Error("bad organization");
  }
} catch (e) {
  console.error('Bad event id : ', eventid, e)
  navigateTo('/admin')
}

const newevent = reactive({
  name: event.name,
  description: event.description,
  creationDate: event.creationDate,
  updateDate: event.updateDate,
  status: event.status,
  author: event.author,
  originId: event.originId,
  imageId: event.imageId,
  imageUrl: event.imageUrl,
  price: event.price,
  url: event.url,
  tags: event.tags,
  publicTypes: event.publicTypes,
  eventType: event.eventType,
  organization: event.organization
})


const dates = ref((await databases.listDocuments('kronikle', 'date', [
  Query.equal('eventId', event.$id as string)
])).documents as unknown as KDate[])

onBeforeMount (async () => {
  const account = Appwrite.account
  console.log(account)
  const prefs = await account.getPrefs()
  if (!prefs.organization) {
    return
  } else {
    newevent.organization = prefs.organization
  }
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

  newevent.updateDate = new Date()

  const databases = new Databases(Appwrite.client)
  const inserted = await databases.updateDocument('kronikle', 'event', event.$id as string, newevent)
  for (const d of dates.value) {
    if (d.new) {
      d.eventId = inserted.$id
      delete d['$id']
      delete d['new']
      datesPromises.push(databases.createDocument('kronikle', 'date', 'unique()', d))
    }
  }

  Promise.all(datesPromises).then(() => {
    console.log('done')
    navigateTo('/admin')
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
