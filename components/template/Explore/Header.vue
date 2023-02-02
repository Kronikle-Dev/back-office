<script lang="ts" setup>
const props = defineProps(['logoUrl', 'corpName'])
</script>

<template>
  <div class="w-full bg-primary-100 flex justify-between flex-row">
    <div>
      <img :src="logoUrl" alt="Logo"/>
      <span class="text-corp-500 font-black text-4xl">{{ corpName }}</span>
    </div>
    <div>
      <NuxtLink></NuxtLink>
    </div>
  </div>
</template>
