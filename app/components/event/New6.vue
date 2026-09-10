<script lang="ts" setup>
import { useEventDraftStore } from '@/stores/eventDraft'

const store = useEventDraftStore()

async function finish() {
  if (store.loading) return
  const ok = await store.publish()
  if (!ok) return
  await navigateTo('/')
  store.reset()
}
</script>

<template>
  <div>
    <div class="card bg-white not-prose">
      <figure><EventVisual :event="store.event" class="w-full max-h-[360px] object-cover" /></figure>
      <div class="card-body">
        <h2 class="card-title">{{store.event.name}}</h2>
        <p>{{store.event.description}}</p>
        <div>
          <span v-for="tag of store.event.tags" :key="tag">#{{store.availableTags.find((t) => t.$id === tag)?.name}} </span>
        </div>
        <div class="grid sm:grid-cols-2 grid-cols-1 gap-4 mt-4">
          <SessionCard v-for="date of store.orderedDates" :key="`${date.$id}`" :date="date" />
        </div>
      </div>
    </div>
    <div class="flex flex-row w-full space-x-4 pb-8">
      <button class="btn btn-outline btn-primary mt-4 grow" :disabled="store.loading" @click="store.prevStep()">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" :disabled="store.loading" @click="finish">
        <span v-if="store.loading" class="loading loading-spinner"></span>
        {{$t('form.finish')}}
      </button>
    </div>
  </div>
</template>
