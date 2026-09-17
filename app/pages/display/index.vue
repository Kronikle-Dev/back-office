<script lang="ts" setup>
import { Databases, Query, Teams } from 'appwrite'
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

const displays = ref([] as Array<KDisplay>)

displays.value = (await $appwrite().getAllPages('kronikle', 'display', [
  Query.equal('organization', organization)
])) as unknown as KDisplay[]

$appwrite().client.subscribe(['databases.kronikle.collections.display.documents'], async () => {
  displays.value = (await $appwrite().getAllPages('kronikle', 'display', [
    Query.equal('organization', organization)
  ])) as unknown as KDisplay[]
})
</script>

<template>
  <div>
    <div class="max-w-xl mx-auto prose">
      <h2>{{$t('display.index.title')}}</h2>
      <p>{{$t('display.index.subtitle')}}</p>
      <NuxtLink to="/display/new" class="btn btn-primary">{{$t('display.index.new')}}</NuxtLink>
      <div class="mt-8">
        <div v-for="display of displays"
          :key="display.$id">
          <div class="card bg-white noprose shadow hover:shadow-lg mt-3">
            <div class="card-body flex-row items-center gap-4">
              <NuxtLink :to="`/display/${display.$id}`" class="no-underline flex flex-col grow">
                <span class="font-bold text-lg">{{ display.name }}</span>
                <span class="font-thin">{{ display.template }}</span>
              </NuxtLink>
              <NuxtLink :to="`/display/${display.$id}/stats`" class="btn btn-ghost btn-sm no-underline" :title="$t('display.index.stats')">
                <svg class="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" /></svg>
                <span class="hidden sm:inline">{{ $t('display.index.stats') }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>