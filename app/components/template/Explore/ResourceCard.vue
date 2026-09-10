<script lang="ts" setup>
const props = defineProps<{
  resource: KResource
}>()
</script>

<template>
  <a :href="props.resource.url ?? ''" target="_blank">
    <div class="rounded-md w-[70vw] sm:w-[260px] shrink-0 p-3 bg-urfist-800 hover:bg-urfist-400 hover:drop-shadow-sm hover:-translate-y-0.5 transition">
      <!-- Embed OG/oEmbed brut : on contraint les iframes tierces à la largeur de la carte. -->
      <div class="rounded bg-white p-3 overflow-hidden [&_iframe]:max-w-full [&_iframe]:w-full [&_img]:max-w-full" v-if="props.resource.html" v-html="props.resource.html"></div>
      <img
        v-if="props.resource.imageUrl && props.resource.imageUrl.length > 0"
        :src="imgSrc(props.resource.imageUrl)"
        :alt="props.resource.name"
        loading="lazy"
        class="w-full max-h-[200px] object-cover rounded"/>
      <div class="flex flex-row space-x-2.5 min-w-0">
        <TemplateExploreResourceTypeIcon class="self-center shrink-0" :resource="props.resource"></TemplateExploreResourceTypeIcon>
        <div class="flex flex-col min-w-0">
          <div class="mt-2.5 font-medium text-lg text-primary-100-kv3 truncate">{{ props.resource.name }}</div>
          <div class="mt-2.5 font-light text-base text-primary-100-kv3 truncate">{{ props.resource.description }}</div>
        </div>
      </div>
    </div>
  </a>
</template>