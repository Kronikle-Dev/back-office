<script lang="ts" setup>
const props = defineProps<{
  resources: KResource[],
  label: string
}>()
</script>

<template>
  <div class="bg-urfist-300 rounded-lg py-6 px-11">
    <div class="font-bold text-2xl text-primary-100-kv3 mb-5">{{ label }}</div>
    <div class="flex flex-row space-x-5">
      <div v-for="res of props.resources" :key="res.$id">{{ res.url }}</div>
    </div>
  </div>
</template>