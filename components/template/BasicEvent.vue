<script lang="ts" setup>
const prop = defineProps(['event'])
</script>

<template>
  <div>
      <span>{{ prop.event.name }}</span>
  </div>
</template>
