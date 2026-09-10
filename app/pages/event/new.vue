<script lang="ts" setup>
import { Teams } from 'appwrite'
import { useEventDraftStore } from '@/stores/eventDraft'

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const store = useEventDraftStore()
const { $appwrite } = useNuxtApp()

// Page SPA (cf. nuxt.config) : l'await au top-level est acceptable et garantit que
// le store est initialisé avant le montage de l'assistant.
const myTeams = await new Teams($appwrite().client).list()
const ready = myTeams.teams.length > 0
if (ready) {
  store.initForCreate(myTeams.teams[0]!.$id)
}
</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <EventNewContainer v-if="ready" />
    <p v-else>{{ $t('event.new.no-organization') }}</p>
  </div>
</template>

<style scoped></style>
