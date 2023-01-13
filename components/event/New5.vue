<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { numeric, integer, maxValue} from '@vuelidate/validators'

const emit = defineEmits(['next', 'prev'])

const props = defineProps(['event'])

const state = reactive({
  minAge: props.event.minAge,
  maxAge: props.event.maxAge,
  price: props.event.price,
})

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

const v$ = useVuelidate(rules, state)

async function next () {
  emit('next', {
    minAge: state.minAge,
    maxAge: state.maxAge,
    price: state.price,
  })
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
      <input v-model="state.minAge" type="text" :placeholder="$t('event.newfive.minAge-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.minAge.$error && v$.minAge.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.maxAge-label')}}</span>
      </label>
      <input v-model="state.maxAge" type="text" :placeholder="$t('event.newfive.maxAge-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.maxAge.$error && v$.maxAge.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.price-label')}}</span>
      </label>
      <input v-model="state.price" type="text" :placeholder="$t('event.newfive.price-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.price.$error && v$.price.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="emit('prev')">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
