<script lang="ts" setup>
const props = defineProps<{
  resource: KResource
}>()
</script>

<template>
  <a :href="props.resource.url ?? ''" target="_blank">
    <div class="rounded-md w-[60vw] md:w-[260px] p-3 mr-5 bg-urfist-800 hover:bg-urfist-400 hover:drop-shadow-sm hover:-translate-y-0.5 transition">
      <div class="rounded bg-white p-3" v-if="props.resource.html" v-html="props.resource.html"></div>
      <img
        v-if="props.resource.imageUrl && props.resource.imageUrl.length > 0"
        :src="props.resource.imageUrl"
        class="max-h-[200px] rounded"/>
      <div class="flex flex-row space-x-2.5">
        <TemplateExploreResourceTypeIcon class="self-center" :resource="props.resource"></TemplateExploreResourceTypeIcon>
        <div class="flex flex-col max-w-full">
          <div class="mt-2.5 font-medium text-lg text-primary-100-kv3 text-ellipsis overflow-hidden shrink max-w-[90%]">{{ props.resource.name }}</div>
          <div class="mt-2.5 font-light text-base text-primary-100-kv3 text-ellipsis overflow-hidden shrink max-w-[90%]">{{ props.resource.description }}</div>
        </div>
      </div>
    </div>
  </a>
</template>