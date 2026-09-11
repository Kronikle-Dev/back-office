<script lang="ts" setup>
import { Teams, Query } from 'appwrite'
const { $appwrite } = useNuxtApp()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const route = useRoute()
const router = useRouter()

const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
const organization = myTeams.teams[0]?.$id ?? ''

const isPremium = (await $appwrite().account?.get()).labels?.includes('premium')

// `originId` des événements déjà importés, toutes sources confondues : sert aux
// deux onglets pour griser les lignes correspondantes.
const existingOriginIds = ref<string[]>([])

if (organization) {
  try {
    const documents = await $appwrite().getAllPages('kronikle', 'event', [
      Query.equal('organization', organization),
    ])
    existingOriginIds.value = documents.map(doc => doc.originId).filter(Boolean)
  } catch (e) {
    console.log(e)
  }
}

const tab = ref(isPremium && route.query.tab === 'sygefor' ? 'sygefor' : 'ical')

function selectTab (value: string) {
  tab.value = value
  router.replace({ query: { ...route.query, tab: value } })
}

function onImported (originId: string) {
  if (!existingOriginIds.value.includes(originId)) {
    existingOriginIds.value = [...existingOriginIds.value, originId]
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto prose">
    <h2>{{ $t('event.import.title') }}</h2>
    <p>{{ $t('event.import.subtitle') }}</p>

    <div v-if="isPremium" role="tablist" class="tabs tabs-boxed not-prose my-4">
      <a role="tab" class="tab" :class="{ 'tab-active': tab === 'ical' }" @click="selectTab('ical')">
        {{ $t('event.import.tabs.ical') }}
      </a>
      <a role="tab" class="tab" :class="{ 'tab-active': tab === 'sygefor' }" @click="selectTab('sygefor')">
        {{ $t('event.import.tabs.sygefor') }}
      </a>
    </div>

    <EventImportIcalImporter
      v-show="tab === 'ical'"
      :organization="organization"
      :existing-origin-ids="existingOriginIds"
      @imported="onImported" />

    <EventImportSygeforImporter
      v-if="isPremium && tab === 'sygefor'"
      :organization="organization"
      :existing-origin-ids="existingOriginIds" />
  </div>
</template>
