<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { required, minLength, maxLength } from '@vuelidate/validators'
import { useEventDraftStore } from '@/stores/eventDraft'

const router = useRouter()
const store = useEventDraftStore()

const rules = {
  name: {
    required,
    minLength: minLength(3),
    maxLength: maxLength(200),
  },
  description: {
    required,
    minLength: minLength(1),
    maxLength: maxLength(3000),
  },
}

// Validation directement sur le brouillon du store : les saisies sont conservées
// même en revenant à l'étape précédente.
const v$ = useVuelidate(rules, store.event)

async function next () {
  if (!(await v$.value.$validate())) return
  store.nextStep()
}

function prev() {
  router.back()
}
</script>

<template>
  <div>
    <h2>{{$t('event.newone.title')}}</h2>
    <p>{{$t('event.newone.subtitle')}}</p>
    <label class="label">
      <span class="label-text">{{$t('event.newone.name-label')}}</span>
    </label>
    <input v-model="store.event.name" type="text" :placeholder="$t('event.newone.name-placeholder')" class="input input-bordered bg-white w-full" />
    <label class="label">
      <span v-if="v$.name.$error && v$.name.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      <span v-if="v$.name.$error && v$.name.minLength.$invalid" class="label-text-alt text-error">{{$t('validation.minLength', {length: 3})}}</span>
      <span v-if="v$.name.$error && v$.name.maxLength.$invalid" class="label-text-alt text-error">{{$t('validation.maxLength', {length: 200})}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('event.newone.description-label')}} <a href="https://www.markdownguide.org/basic-syntax/" target="_blank">ℹ️</a></span>
    </label>
    <textarea v-model="store.event.description" class="min-h-[15rem] textarea textarea-bordered bg-white w-full" :placeholder="$t('event.newone.description-placeholder')"/>
    <label class="label">
      <span v-if="v$.description.$error && v$.description.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      <span v-if="v$.description.$error && v$.description.minLength.$invalid" class="label-text-alt text-error">{{$t('validation.minLength', {length: 1})}}</span>
      <span v-if="v$.description.$error && v$.description.maxLength.$invalid" class="label-text-alt text-error">{{$t('validation.maxLength', {length: 3000})}}</span>
    </label>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="prev">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
