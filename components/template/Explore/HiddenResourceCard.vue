<script lang="ts" setup>
const props = defineProps<{
  resources: KResource[],
}>()
</script>

<template>
  <div class="bg-urfist-200 w-[240px] h-fit rounded-lg p-5 cursor-pointer">
    <div class="font-bold text-2xl text-primary-100-kv3 mb-5">{{ props.resources.length }} {{ $t('displays.kronikle-v3.additional-resource-to-consult') }}</div>
    <div class="flex flex-row flex-wrap space-x-5">
      <div
        class="w-14 h-14 bg-urfist-50 rounded-lg"
        v-for="res of props.resources"
        :key="res.$id">
      </div>
    </div>
    <div class="mt-2.5 underline">{{ $t('displays.kronikle-v3.click-here') }}</div>
  </div>
</template>