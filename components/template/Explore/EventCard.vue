<script setup lang="ts">
const props = defineProps<{
  event: KEvent
}>()
</script>

<template>
  <div class="flex flex-col w-52 bg-primary-700-kv3 rounded-lg">
    <img class="h-28" :src="event.imageUrl"/>
    <div class="font-semibold text-lg text-primary-100-kv3">{{ event.name }}</div>
  </div>
</template>