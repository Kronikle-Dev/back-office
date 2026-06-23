<script lang="ts" setup>
const props = defineProps<{
  resources: KResource[],
}>()
</script>

<template>
  <div>
    <div class="bg-urfist-200 w-[240px] h-fit mr-5 rounded-lg p-5 cursor-pointer">
      <div class="font-bold text-2xl text-primary-100-kv3 mb-5">{{ props.resources.length }} {{ $t('displays.kronikle-v3.additional-resource-to-consult') }}</div>
      <div class="grid grid-cols-3 gap-5">
        <div
          class="w-14 h-14 bg-urfist-50 rounded-lg grid grid-cols-1 place-content-center"
          v-for="res of props.resources"
          :key="res.$id">
          <TemplateExploreResourceTypeIcon class="text-urfist-300 w-fit mx-auto" :resource="res"></TemplateExploreResourceTypeIcon>
        </div>
      </div>
      <div class="mt-2.5 underline">{{ $t('displays.kronikle-v3.click-here') }}</div>
    </div>
  </div>
</template>