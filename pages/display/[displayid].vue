<script lang="ts" setup>
import { Databases } from 'appwrite'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
definePageMeta({
  middleware: ["auth"],
  layout: "app",
})
const prefs = await $appwrite().account.getPrefs()
const organization = prefs.organization
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
