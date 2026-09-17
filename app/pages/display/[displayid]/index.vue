<script lang="ts" setup>
import { Databases, Teams } from 'appwrite'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

let organization = ''
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
if (myTeams.teams.length === 0) {
  organization = ''
}
const myTeamId = myTeams.teams[0].$id
organization = myTeamId

const displayid = route.params.displayid as string
let display = null as unknown as KDisplay

try {
  display = (await databases.getDocument('kronikle', 'display', displayid)) as unknown as KDisplay
  if (display.organization != organization) {
    throw new Error("bad organization");
  }
} catch (e) {
  console.error('Bad event id : ', displayid, e)
  navigateTo('/')
}

</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <NuxtLink :to="`/display/${displayid}/stats`" class="btn btn-outline btn-sm no-underline">
      <svg class="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" /></svg>
      {{ $t('display.form.stats-link') }}
    </NuxtLink>
    <DisplayForm :display="display"></DisplayForm>
  </div>
</template>
