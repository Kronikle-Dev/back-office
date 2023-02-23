<script lang="ts" setup>
const props = defineProps<{
  resource: KResource
}>()
</script>

<template>
  <a :href="props.resource.url ?? ''" target="_blank">
    <div class="rounded-md w-[260px] p-3 bg-urfist-800 hover:bg-urfist-400 hover:drop-shadow-sm hover:-translate-y-0.5 transition">
      <img v-if="props.resource.imageUrl && props.resource.imageUrl.length > 0" :src="props.resource.imageUrl" />
      <div class="flex flex-row space-x-2.5">
        <img />
        <div>{{ props.resource.name }}</div>
      </div>
    </div>
  </a>
</template>