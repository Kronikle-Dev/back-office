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
displays.value = (await $appwrite().getAllPages('kronikle', 'event', [
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
          <NuxtLink :to="`/display/${display.$id}`" class="no-underline">
            <div class="card bg-white flex flex-row noprose shadow hover:shadow-lg mt-3">
              <div class="card-body">
                <span class="font-bold text-lg">{{ display.name }}</span>
                <span class="font-thin">{{ display.template }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>