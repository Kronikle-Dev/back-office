<script lang="ts" setup>
const router = useRouter()
import {useVuelidate} from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'
import { Teams } from 'appwrite'
const {$appwrite} = useNuxtApp()
const config = useRuntimeConfig()

definePageMeta({
  layout: "blank",
})

const state = reactive({
  email: '',
  loading: false,
  error: null as unknown
})

const rules = {
  email: {
    required,
    email,
  },
}

const v$ = useVuelidate(rules, state)

async function recovery () {
  const formValid = await v$.value.$validate()
  if (!formValid) {
    return
  }
  state.loading = true
  const account = $appwrite().account
  const teams = new Teams($appwrite().client)
  try {
    const respCreation = await account.createRecovery(state.email, `${config.public.Hostname}/recovery-setnew`)
    state.loading = false
    await navigateTo('/recovery-ok')
  } catch (error) {
    state.loading = false
    state.error = error
    console.log(error)
  }
}
</script>

<template>
  <div>
    <div class="max-w-lg mx-auto px-4 mt-20 prose">
      <h1 class="h1">{{$t('recovery.title')}}</h1>
      <label class="label">
        <span class="label-text">{{$t('recovery.email')}}</span>
      </label>
      <input v-model="state.email" type="email" :placeholder="$t('recovery.email-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.email.$error && v$.email.email.$invalid" class="label-text-alt text-error">{{$t('validation.email')}}</span>
        <span v-if="v$.email.$error && v$.email.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <div class="flex flex-row w-full space-x-4">
        <button class="btn btn-primary mt-4 grow" :class="{'loading': state.loading}" @click="recovery">{{$t('recovery.recover')}}</button>
      </div>
    </div>
    <div v-if="state.error" class="toast toast-end">
      <div class="alert alert-error">
        <div>
          <span>{{ $t('recovery.error') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
