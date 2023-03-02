<script lang="ts" setup>
const props = defineProps<{
  resources: KResource[],
  label: string
}>()

const state = reactive({
  showModale: false
})

const shownResources = [] as KResource[]
const hiddenResources = [] as KResource[]
//si 5+
if (props.resources.length >= 5) {
  hiddenResources.push(...props.resources.slice(3))
  shownResources.push(...props.resources.slice(0, 3))
} else {
//si 4-
  shownResources.push(...props.resources)
}

</script>

<template>
  <div class="bg-urfist-300 w-fit max-w-[calc(100%-16px)] px-8 overflow-x-scroll nobar rounded-lg py-6">
    <div class="font-bold text-2xl text-primary-100-kv3 mb-5">{{ label }}</div>
    <div class="flex flex-row space-x-5">
      <TemplateExploreResourceCard
        v-for="res of shownResources"
        :key="res.$id"
        :resource="res">
      </TemplateExploreResourceCard>
      <TemplateExploreHiddenResourceCard
        @click="state.showModale = true"
        v-if="hiddenResources.length > 0"
        :resources="hiddenResources">
      </TemplateExploreHiddenResourceCard>
    </div>
    <input type="checkbox" id="my-modal" class="modal-toggle" v-model="state.showModale" />
    <div class="modal cursor-pointer">
      <div class="modal-box max-w-4xl bg-urfist-200 rounded-lg px-16 py-10">
        <div class="flex flex-row justify-between">
          <div>
            <h3 class="font-bold text-lg">{{ props.label }}</h3>
            <h4>{{ $t('displays.kronikle-v3.supplementary-material') }}</h4>
          </div>
          <label class="btn btn-primary"  @click="state.showModale = false">X</label>
        </div>
        <div class="flex flex-row flex-wrap">
          <TemplateExploreResourceCard
            class="mr-5 mt-5"
            v-for="res of hiddenResources"
            :key="res.$id"
            :resource="res">
          </TemplateExploreResourceCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
 /* Hide scrollbar for Chrome, Safari and Opera */
 .nobar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.nobar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
} 
</style>