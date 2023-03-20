<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { Databases } from 'appwrite'
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
const {$appwrite} = useNuxtApp()


const emit = defineEmits(['next', 'prev'])

const props = defineProps(['event'])

const state = reactive({
    tags: props.event.tags.map((t: string) => ({$id: t})),
    publicTypes: props.event.publicTypes.map((t: string) => ({$id: t})),
    eventType: props.event.eventType.map((t: string) => ({$id: t})),
})

const availableTags = ref([] as Array<{$id: string, name: string}>)
const availablePublicTypes = ref([] as Array<{$id: string, name: string}>)
const availableEventTypes = ref([] as Array<{$id: string, name: string}>)

onMounted(() => {
  const databases = new Databases($appwrite().client)
  let promiseArray = []
  promiseArray.push($appwrite().getAllPages('kronikle', 'tag').then((response) => {
    availableTags.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'public-type').then((response) => {
    availablePublicTypes.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'event-type').then((response) => {
    availableEventTypes.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))

  Promise.all(promiseArray).then(values => {
    state.publicTypes = state.publicTypes.map((e: {$id: string}) => ({$id: e.$id, name: availablePublicTypes.value.find(ae => ae.$id == e.$id)?.name}))
    state.eventType = state.eventType.map((e: {$id: string}) => ({$id: e.$id, name: availableEventTypes.value.find(ae => ae.$id == e.$id)?.name}))
    state.tags = state.tags.map((e: {$id: string}) => ({$id: e.$id, name: availableTags.value.find(ae => ae.$id == e.$id)?.name}))
  })
})


async function next () {
  emit('next', {
    tags: state.tags.map((tag: {$id: string, name: string}) => tag.$id),
    publicTypes: state.publicTypes.map((type: {$id: string, name: string}) => type.$id),
    eventType: state.eventType.map((type: {$id: string, name: string}) => type.$id),
  })
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
      <button class="btn btn-outline btn-primary mt-4 grow" @click="emit('prev')">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
