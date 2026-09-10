<script lang="ts" setup>
import { useEventDraftStore } from '@/stores/eventDraft'
// @ts-ignore
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'

type ReferenceItem = { $id: string, name: string }

const store = useEventDraftStore()

// Le store conserve des identifiants, VueMultiselect manipule des objets
// { $id, name } : un computed en lecture/écriture fait la conversion, sans copie
// locale. Un identifiant sans référentiel chargé s'affiche par son id.
function bind (
  key: 'tags' | 'publicTypes' | 'eventType',
  available: () => ReferenceItem[],
) {
  return computed<ReferenceItem[]>({
    get: () => store.event[key].map((id) => available().find((item) => item.$id === id) ?? { $id: id, name: id }),
    set: (items) => { store.event[key] = items.map((item) => item.$id) },
  })
}

const tags = bind('tags', () => store.availableTags)
const publicTypes = bind('publicTypes', () => store.availablePublicTypes)
const eventType = bind('eventType', () => store.availableEventTypes)

function next () {
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
        v-model="tags"
        :multiple="true"
        :close-on-select="true"
        :placeholder="$t('event.newfour.tags-placeholder')"
        label="name"
        track-by="$id"
        :options="store.availableTags">
      </VueMultiselect>
    </ClientOnly>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.publicTypes-label')}}</span>
    </label>
    <ClientOnly>
      <VueMultiselect
        v-model="publicTypes"
        :multiple="true"
        :close-on-select="true"
        :placeholder="$t('event.newfour.publicTypes-placeholder')"
        label="name"
        track-by="$id"
        :options="store.availablePublicTypes">
      </VueMultiselect>
    </ClientOnly>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.eventTypes-label')}}</span>
    </label>
    <ClientOnly>
      <VueMultiselect
        v-model="eventType"
        :multiple="true"
        :close-on-select="true"
        :placeholder="$t('event.newfour.eventTypes-placeholder')"
        label="name"
        track-by="$id"
        :options="store.availableEventTypes">
      </VueMultiselect>
    </ClientOnly>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="store.prevStep()">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
