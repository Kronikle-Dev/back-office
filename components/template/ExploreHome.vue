<script lang="ts" setup>
const prop = defineProps(['events'])

const events = computed((): KEvent[] => prop.events as unknown[] as KEvent[])
</script>

<template>
  <div data-theme="urfist">
    <div v-for="event of events" :key="event.$id">
      <span>{{ event.name }}</span>
    </div>
  </div>
</template>
