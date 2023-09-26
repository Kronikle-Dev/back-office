<script lang="ts" setup>
const router = useRouter()
import {useVuelidate} from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'
const {$appwrite} = useNuxtApp()

definePageMeta({
  layout: "blank",
})

const state = reactive({
  email: '',
  password: '',
  loading: false,
  error: null as unknown
})

const rules = {
  email: {
    required,
    email,
  },
  password: {
    required,
  },
}

const v$ = useVuelidate(rules, state)

async function login () {
  console.log(v$)
  const formValid = await v$.value.$validate()
  if (!formValid) {
    return
  }
  state.loading = true
  const account = $appwrite().account
  try {
    const resp = await account.createEmailSession(state.email, state.password)
    state.loading = false
    await navigateTo('/')
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
      <h1 class="h1">{{$t('login.title')}}</h1>
      <label class="label">
        <span class="label-text">{{$t('login.email')}}</span>
      </label>
      <input v-model="state.email" type="email" :placeholder="$t('login.email-placeholder')" class="input input-bordered bg-white w-full"  @keypress.enter="login"/>
      <label class="label">
        <span v-if="v$.email.$error && v$.email.email.$invalid" class="label-text-alt text-error">{{$t('validation.email')}}</span>
        <span v-if="v$.email.$error && v$.email.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <label class="label">
        <span class="label-text">{{$t('login.password')}}</span>
      </label>
      <input v-model="state.password" type="password" :placeholder="$t('login.password-placeholder')" class="input input-bordered bg-white w-full" @keypress.enter="login" />
      <label class="label">
        <span v-if="v$.password.$error && v$.password.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <div class="flex flex-row items-center w-full space-x-4">
        <nuxt-link to="/signup" class="link link-secondary font-semibold mt-4">{{$t('login.signup')}}</nuxt-link>
        <button class="btn btn-primary mt-4 grow" :class="{'loading': state.loading}" @click="login">{{$t('login.login')}}</button>
      </div>
      <div class="flex flex-row items-center w-full space-x-4">
        <nuxt-link to="/recovery" class="link link-secondary font-semibold mt-4">{{$t('login.recovery')}}</nuxt-link>
      </div>
    </div>
    <div v-if="state.error" class="toast toast-end">
      <div class="alert alert-error">
        <div>
          <span>{{ $t('login.error') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
