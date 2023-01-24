<script lang="ts" setup>
import { Databases } from 'appwrite'
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
  imageUrl: '',
  price: null,
  url: null,
  tags: [],
  publicTypes: [],
  eventType: [],
  organization: ''
})

const dates = ref([] as Array<any>)

onBeforeMount (async () => {
  const account = $appwrite().account
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

  newevent.creationDate = new Date().toISOString()
  newevent.updateDate = new Date().toISOString()

  const databases = new Databases($appwrite().client)
  const inserted = await databases.createDocument('kronikle', 'event', 'unique()', newevent)
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
