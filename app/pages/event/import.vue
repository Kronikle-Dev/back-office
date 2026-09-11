<script lang="ts" setup>
import { Teams, Query } from 'appwrite'
import { sygeforTeamId } from '#shared/sygefor'
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
const organizationName = myTeams.teams[0]?.name ?? ''

// L'importeur Sygefor a été développé pour une organisation précise, et ses routes
// serveur sont résolues depuis l'id de team : il n'a de sens que pour elle. Les autres
// se voient proposer le développement de leur propre connecteur.
const isSygeforTeam = organization === sygeforTeamId
const secondTab = isSygeforTeam ? 'sygefor' : 'custom'

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

const tab = ref(route.query.tab === secondTab ? secondTab : 'ical')

// URL forgée (`?tab=sygefor` sur un compte qui n'y a pas droit) : on retombe sur
// l'onglet calendrier et on nettoie la query plutôt que de laisser un état trompeur.
if (route.query.tab && route.query.tab !== tab.value) {
  router.replace({ query: { ...route.query, tab: tab.value } })
}

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

    <div role="tablist" class="tabs tabs-boxed not-prose my-4">
      <a role="tab" class="tab" :class="{ 'tab-active': tab === 'ical' }" @click="selectTab('ical')">
        {{ $t('event.import.tabs.ical') }}
      </a>
      <a role="tab" class="tab" :class="{ 'tab-active': tab === secondTab }" @click="selectTab(secondTab)">
        {{ $t(`event.import.tabs.${secondTab}`) }}
      </a>
    </div>

    <EventImportIcalImporter
      v-show="tab === 'ical'"
      :organization="organization"
      :existing-origin-ids="existingOriginIds"
      @imported="onImported" />

    <EventImportSygeforImporter
      v-if="isSygeforTeam && tab === 'sygefor'"
      :organization="organization"
      :existing-origin-ids="existingOriginIds" />

    <EventImportCustomImporterPitch
      v-if="!isSygeforTeam && tab === 'custom'"
      :organization-name="organizationName"
      @select-ical="selectTab('ical')" />
  </div>
</template>
