<script lang="ts" setup>
import { Teams } from 'appwrite'
import { useEventDraftStore } from '@/stores/eventDraft'

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const store = useEventDraftStore()

onBeforeMount(async () => {
  const { $appwrite } = useNuxtApp()
  const teams = new Teams($appwrite().client)
  const myTeams = await teams.list()
  if (myTeams.teams.length === 0) {
    return
  }
  store.initForCreate(myTeams.teams[0].$id)
})
</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <EventNewContainer />
  </div>
</template>

<style scoped></style>
