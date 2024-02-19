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


const route = useRoute()
const userId = route.query.userId as string
const secret = route.query.secret as string

const state = reactive({
  password: '',
  loading: false,
  error: null as unknown
})

const rules = {
  password: {
    required,
    minLength: minLength(8),
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
    const respCreation = await account.updateRecovery(userId, secret, state.password, state.password)
    state.loading = false
    await navigateTo('/login')
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
      <h1 class="h1">{{$t('recovery.setnew-title')}}</h1>
      <label class="label mt-4">
        <span class="label-text">{{$t('recovery.password')}}</span>
      </label>
      <input v-model="state.password" type="password" :placeholder="$t('recovery.password-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.password.$error && v$.password.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
        <span v-if="v$.password.$error && v$.password.minLength.$invalid" class="label-text-alt text-error">{{$t('validation.minLength', {length: 8})}}</span>
      </label>
      <div class="flex flex-row w-full space-x-4">
        <button class="btn btn-primary mt-4 grow" @click="recovery">
          <span v-if="state.loading" class="loading"></span>
          {{$t('recovery.recovery')}}
        </button>
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
