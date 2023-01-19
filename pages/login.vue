<script lang="ts" setup>
const router = useRouter()
import Appwrite from '~~/utils/appwrite'
import {useVuelidate} from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'

definePageMeta({
  layout: "blank",
})

const state = reactive({
  email: '',
  password: '',
  loading: false,
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
  const account = Appwrite.account
  try {
    const resp = await account.createEmailSession(state.email, state.password)
    state.loading = false
    console.log(resp)
    await navigateTo('/')
  } catch (error) {
    state.loading = false
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
      <input v-model="state.email" type="email" :placeholder="$t('login.email-placeholder')" class="input input-bordered w-full" />
      <label class="label">
        <span v-if="v$.email.$error && v$.email.email.$invalid" class="label-text-alt text-error">{{$t('validation.email')}}</span>
        <span v-if="v$.email.$error && v$.email.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <label class="label">
        <span class="label-text">{{$t('login.password')}}</span>
      </label>
      <input v-model="state.password" type="password" :placeholder="$t('login.password-placeholder')" class="input input-bordered w-full" @keypress.enter="login" />
      <label class="label">
        <span v-if="v$.password.$error && v$.password.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <div class="flex flex-row w-full space-x-4">
        <button class="btn btn-primary mt-4 grow" :class="{'loading': state.loading}" @click="login">{{$t('login.login')}}</button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
