<script lang="ts" setup>
import { useEventDraftStore, LAST_STEP } from '@/stores/eventDraft'

// Le store doit être initialisé (initForCreate / initFromExisting) avant le
// montage de ce composant : les pages ne le rendent qu'une fois prêtes.
const store = useEventDraftStore()
const route = useRoute()
const router = useRouter()

const stepLabels = [
  'event.new.step-one',
  'event.new.step-two',
  'event.new.step-three',
  'event.new.step-four',
  'event.new.step-five',
  'event.new.step-six',
]

// Étape dans l'URL (`?step=N`, affichée à partir de 1) : un rafraîchissement ou un
// lien partagé rouvre la bonne étape, bornée par `maxReachedStep` dans le store.
onMounted(() => {
  const fromUrl = Number(route.query.step)
  if (Number.isInteger(fromUrl)) {
    store.goToStep(fromUrl - 1)
  }
  store.fetchReferenceData()
})

watch(() => store.step, (step) => {
  const current = Number(route.query.step)
  if (current === step + 1) return
  router.replace({ query: { ...route.query, step: String(step + 1) } })
}, { immediate: true })

// Toast d'erreur : le store dépose une clé i18n, effacée après quelques secondes.
let errorTimer: ReturnType<typeof setTimeout> | undefined
watch(() => store.error, (message) => {
  clearTimeout(errorTimer)
  if (message) {
    errorTimer = setTimeout(() => store.clearError(), 6000)
  }
})
onBeforeUnmount(() => clearTimeout(errorTimer))
</script>

<template>
  <div class="pb-24">
    <ul class="steps pl-0 w-full">
      <li
        v-for="(label, i) of stepLabels"
        :key="label"
        class="step"
        :class="{ 'step-primary': store.step >= i, 'cursor-pointer': i <= store.maxReachedStep }"
        @click="store.goToStep(i)"
      >{{ $t(label) }}</li>
    </ul>
    <h1 class="h1">{{ store.event.name.length > 0 ? store.event.name : $t('event.new.title') }}</h1>
    <div v-if="store.restoredFromDraft" class="alert alert-info not-prose my-4">
      <span>{{ $t('event.new.draft-restored') }}</span>
      <button class="btn btn-sm btn-outline" @click="store.discardDraft()">{{ $t('event.new.discard-draft') }}</button>
    </div>
    <EventNew1 v-if="store.step == 0" />
    <EventNew2 v-if="store.step == 1" />
    <EventNew3 v-if="store.step == 2" />
    <EventNew4 v-if="store.step == 3" />
    <EventNew5 v-if="store.step == 4" />
    <EventNew6 v-if="store.step == LAST_STEP" />
    <div v-if="store.error" class="toast toast-end z-50">
      <div class="alert alert-error"><span>{{ $t(store.error) }}</span></div>
    </div>
  </div>
</template>

<style scoped></style>
