<script lang="ts" setup>
import { Databases, Query } from 'appwrite'
const {$appwrite} = useNuxtApp()

const databases = new Databases($appwrite().client)
const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization

const props = defineProps<{
  event: KEvent,
}>()


const resources = ref([] as KResource[])

resources.value = (await databases.listDocuments('kronikle', 'resource', [
  Query.equal('organization', organization),
  Query.equal('eventId', props.event.$id as string)
])).documents as unknown as KResource[]

$appwrite().client.subscribe(['databases.kronikle.collections.resource.documents'], async () => {
  console.log('refresh resources')
  resources.value = (await databases.listDocuments('kronikle', 'resource', [
    Query.equal('organization', organization),
    Query.equal('eventId', props.event.$id as string)
  ])).documents as unknown as KResource[]
})

async function deleteResource (resource: KResource) {
  const deletionRes = await databases.deleteDocument('kronikle', 'resource', resource.$id as string)
}

</script>

<template>
  <div class="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-4 ml-4 space-x-2">
    <div v-for="resource of resources" :key="resource.$id" class="card w-60 bg-white shadow indicator mt-4 not-prose">
      <span class="indicator-item badge badge-primary cursor-pointer" @click="deleteResource(resource)">x</span> 
      <figure v-if="resource.imageUrl && resource.imageUrl.length > 0"><img :src="resource.imageUrl" :alt="resource.imageAlt" /></figure>
      <div class="card-body overflow-hidden">
        <h2 class="card-title"
          v-if="resource.name.length > 0">
          {{resource.name}}
        </h2>
        <p v-if="resource.url && resource.url?.length > 0"><a :href="resource.url" class="text-sm">{{resource.url}}</a></p>
        <p v-if="resource.description && resource.description?.length > 0">{{resource.description}}</p>
        <div class="card-actions justify-end">
          <div class="badge badge-outline" v-for="tag of resource.tags" :key="tag">{{tag}}</div>
        </div>
      </div>
    </div>
  </div>
</template>