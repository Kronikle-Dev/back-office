<script lang="ts" setup>
import { Teams } from 'appwrite'
const {$appwrite} = useNuxtApp()


let organization = ''
const teams = new Teams($appwrite().client)
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

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{$t('profile.title')}}</h2>
    <p>{{$t('profile.subtitle')}}</p>
  </div>
</template>