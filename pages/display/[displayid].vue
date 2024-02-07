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
    <DisplayForm :display="display"></DisplayForm>
  </div>
</template>
