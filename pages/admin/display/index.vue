<script lang="ts" setup>
import Appwrite from '~~/utils/appwrite'
import { Databases, Query } from 'appwrite'

const databases = new Databases(Appwrite.client)
const prefs = await Appwrite.account.getPrefs()
const organization = prefs.organization

definePageMeta({
  middleware: ["auth"],
  layout: "app"
})

const displays = ref([] as Array<KDisplay>)

displays.value = (await databases.listDocuments('kronikle', 'display', [
  Query.equal('organization', organization)
])).documents as unknown as KDisplay[]

Appwrite.client.subscribe(['databases.kronikle.collections.display.documents'], async response => {
displays.value = (await databases.listDocuments('kronikle', 'event', [
    Query.equal('organization', organization)
  ])).documents as unknown as KDisplay[]
})
</script>

<template>
  <div>
    <div class="max-w-xl mx-auto prose">
      <h2>{{$t('display.index.title')}}</h2>
      <p>{{$t('display.index.subtitle')}}</p>
      <NuxtLink to="/admin/display/new" class="btn btn-primary">{{$t('display.index.new')}}</NuxtLink>
      <div class="mt-8">
        <div v-for="display of displays"
          :key="display.$id">
          <NuxtLink :to="`/admin/display/${display.$id}`" class="no-underline">
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