<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { useEventDraftStore } from '@/stores/eventDraft'
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

const store = useEventDraftStore()

const state = reactive({
    tags: store.event.tags.map((t: string) => ({$id: t})),
    publicTypes: store.event.publicTypes.map((t: string) => ({$id: t})),
    eventType: store.event.eventType.map((t: string) => ({$id: t})),
})

const availableTags = computed(() => store.availableTags)
const availablePublicTypes = computed(() => store.availablePublicTypes)
const availableEventTypes = computed(() => store.availableEventTypes)

onMounted(async () => {
  await store.fetchReferenceData()
  state.publicTypes = state.publicTypes.map((e: {$id: string}) => ({$id: e.$id, name: availablePublicTypes.value.find(ae => ae.$id == e.$id)?.name}))
  state.eventType = state.eventType.map((e: {$id: string}) => ({$id: e.$id, name: availableEventTypes.value.find(ae => ae.$id == e.$id)?.name}))
  state.tags = state.tags.map((e: {$id: string}) => ({$id: e.$id, name: availableTags.value.find(ae => ae.$id == e.$id)?.name}))
})

async function next () {
  store.updateFragment({
    tags: state.tags.map((tag: {$id: string, name: string}) => tag.$id),
    publicTypes: state.publicTypes.map((type: {$id: string, name: string}) => type.$id),
    eventType: state.eventType.map((type: {$id: string, name: string}) => type.$id),
  })
  store.nextStep()
}
</script>

<template>
  <div>
    <h2>{{$t('event.newfour.title')}}</h2>
    <p>{{$t('event.newfour.subtitle')}}</p>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.tags-label')}}</span>
    </label>
    <ClientOnly>
      <VueMultiselect
        v-model="state.tags"
        :multiple="true"
        :close-on-select="true"
        :placeholder="$t('event.newfour.tags-placeholder')"
        label="name"
        track-by="$id"
        :options="availableTags">
      </VueMultiselect>
    </ClientOnly>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.publicTypes-label')}}</span>
    </label>
    <ClientOnly>
      <VueMultiselect
        v-model="state.publicTypes"
        :multiple="true"
        :close-on-select="true"
        :placeholder="$t('event.newfour.publicTypes-placeholder')"
        label="name"
        track-by="$id"
        :options="availablePublicTypes">
      </VueMultiselect>
    </ClientOnly>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.eventTypes-label')}}</span>
    </label>
    <ClientOnly>
      <VueMultiselect
        v-model="state.eventType"
        :multiple="true"
        :close-on-select="true"
        :placeholder="$t('event.newfour.eventTypes-placeholder')"
        label="name"
        track-by="$id"
        :options="availableEventTypes">
      </VueMultiselect>
    </ClientOnly>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="store.prevStep()">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
