<script lang="ts" setup>
import { useEventDraftStore } from '@/stores/eventDraft'

const store = useEventDraftStore()

onMounted(() => {
  store.fetchReferenceData()
})
</script>

<template>
  <div class="pb-24">
    <ul class="steps pl-0">
      <li class="step step-primary">{{$t('event.new.step-one')}}</li>
      <li class="step" :class="{'step-primary': store.step >= 1}">{{$t('event.new.step-two')}}</li>
      <li class="step" :class="{'step-primary': store.step >= 2}">{{$t('event.new.step-three')}}</li>
      <li class="step" :class="{'step-primary': store.step >= 3}">{{$t('event.new.step-four')}}</li>
      <li class="step" :class="{'step-primary': store.step >= 4}">{{$t('event.new.step-five')}}</li>
    </ul>
    <h1 class="h1">{{store.event.name.length > 0 ? store.event.name : $t('event.new.title')}}</h1>
    <EventNew1 v-if="store.step == 0" />
    <EventNew2 v-if="store.step == 1" />
    <EventNew3 v-if="store.step == 2" />
    <EventNew4 v-if="store.step == 3" />
    <EventNew5 v-if="store.step == 4" />
    <EventNew6 v-if="store.step == 5" />
  </div>
</template>

<style scoped></style>
