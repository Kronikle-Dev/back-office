<script lang="ts" setup>
import { Account, Teams, Query } from 'appwrite'
const {$appwrite} = useNuxtApp()
const router = useRouter()


let organization = ''
const teams = new Teams($appwrite().client)
const account = new Account($appwrite().client)
const myTeams = await teams.list()
if (myTeams.teams.length === 0) {
  organization = ''
}
const myTeamId = myTeams.teams[0].$id
organization = myTeamId
const deletedEvents = ref([] as KEvent[])

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

function logout() {
  account.deleteSession('current').then(() => {
    router.push('/login')
  })
}

onMounted(async () => {
  deletedEvents.value = (await $appwrite().getAllPages('kronikle', 'event', [
    Query.equal('organization', organization),
    Query.equal('status', 'archived')
  ])) as unknown as KEvent[]
})

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{$t('profile.title')}}</h2>
    <p>{{$t('profile.subtitle')}}</p>
    <h2>{{ $t('profile.deleted-events') }}</h2>
    <div>
      <div v-for="event in deletedEvents" :key="event.$id"> 
        <NuxtLink :to="`/event/${event.$id}`">{{ event.name }}</NuxtLink>
      </div>
    </div>
    <button class="btn btn-primary mt-10" @click="logout">{{ $t('profile.logout') }}</button>
  </div>
</template>