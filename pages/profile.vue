<script lang="ts" setup>
import { Account, Teams } from 'appwrite'
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

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

function logout() {
  account.deleteSession('current')
  router.push('/')
}

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{$t('profile.title')}}</h2>
    <p>{{$t('profile.subtitle')}}</p>
    <a @click="logout">{{ $t('profile.logout') }}</a>
  </div>
</template>