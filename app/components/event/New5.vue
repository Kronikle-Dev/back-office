<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { numeric, integer } from '@vuelidate/validators'
import { useEventDraftStore } from '@/stores/eventDraft'

const store = useEventDraftStore()

const rules = {
  minAge: {
    integer,
  },
  maxAge: {
    integer,
  },
  price: {
    numeric,
  }
}

// Les champs sont liés directement au brouillon ; la conversion en nombres se fait
// dans le store au moment de la publication (`eventPayload`).
const v$ = useVuelidate(rules, store.event)

async function next () {
  if (!(await v$.value.$validate())) return
  store.nextStep()
}
</script>

<template>
  <div>
    <h2>{{$t('event.newfive.title')}}</h2>
    <p>{{$t('event.newfive.subtitle')}}</p>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.minAge-label')}}</span>
      </label>
      <input v-model="store.event.minAge" type="text" :placeholder="$t('event.newfive.minAge-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.minAge.$error && v$.minAge.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.maxAge-label')}}</span>
      </label>
      <input v-model="store.event.maxAge" type="text" :placeholder="$t('event.newfive.maxAge-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.maxAge.$error && v$.maxAge.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.price-label')}}</span>
      </label>
      <input v-model="store.event.price" type="text" :placeholder="$t('event.newfive.price-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.price.$error && v$.price.numeric.$invalid" class="label-text-alt text-error">{{$t('validation.numeric')}}</span>
      </label>
    </div>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="store.prevStep()">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
