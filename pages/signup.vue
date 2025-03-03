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
  password: '',
  name: '',
  prenom: '',
  nom: '',
  newsletter: false,
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
    minLength: minLength(8),
  },
  name: {
    required,
  },
}

const v$ = useVuelidate(rules, state)

async function signup () {
  const formValid = await v$.value.$validate()
  if (!formValid) {
    return
  }
  function getLanguageFirstTwoChars () {
    // if locale first two characters are 'fr', return 'fr', otherwhise return 'en'
    if (navigator.language.substring(0, 2) === 'fr') {
      return 'fr'
    } else {
      return 'en'
    }
  }
  state.loading = true
  const account = $appwrite().account
  $appwrite().client.setLocale(getLanguageFirstTwoChars())
  const teams = new Teams($appwrite().client)
  try {
    const respCreation = await account.create('unique()', state.email, state.password, state.name)
    const resp = await account.createEmailSession(state.email, state.password)
    const respTeam = await teams.create('unique()', state.name)
    const result = await account.updatePrefs(
        {
          nom: state.nom,
          prenom: state.prenom,
        }
    );
    const respVer = await account.createVerification(`${config.public.Hostname}/verify`)
    // if the browse supports it, store in localStorage a boolean to show the tutorial
    if (typeof(Storage) !== 'undefined') {
      localStorage.setItem('tutorial', 'true')
    }
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
      <h1 class="h1">{{$t('signup.title')}}</h1>
      <label class="label">
        <span class="label-text">{{$t('signup.email')}}</span>
      </label>
      <input v-model="state.email" type="email" :placeholder="$t('signup.email-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.email.$error && v$.email.email.$invalid" class="label-text-alt text-error">{{$t('validation.email')}}</span>
        <span v-if="v$.email.$error && v$.email.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <label class="label mt-4">
        <span class="label-text">{{$t('signup.name')}}</span>
      </label>
      <input v-model="state.name" type="text" :placeholder="$t('signup.name-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.name.$error && v$.name.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      </label>
      <label class="label mt-4">
        <span class="label-text">{{$t('signup.prenom')}}</span>
      </label>
      <input v-model="state.prenom" type="text" :placeholder="$t('signup.prenom-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label mt-4">
        <span class="label-text">{{$t('signup.nom')}}</span>
      </label>
      <input v-model="state.nom" type="text" :placeholder="$t('signup.nom-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label mt-4">
        <span class="label-text">{{$t('signup.password')}}</span>
      </label>
      <input v-model="state.password" type="password" :placeholder="$t('signup.password-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="v$.password.$error && v$.password.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
        <span v-if="v$.password.$error && v$.password.minLength.$invalid" class="label-text-alt text-error">{{$t('validation.minLength', {length: 8})}}</span>
      </label>
      <label class="italic" v-html="$t('signup.consent')"></label>
      <div class="flex flex-row w-full space-x-4">
        <nuxt-link to="/login" class="link link-secondary font-semibold mt-4">{{$t('signup.login')}}</nuxt-link>
        <button class="btn btn-primary mt-4 grow" @click="signup">
          <span v-if="state.loading" class="loading loading-spinner"></span>
          {{$t('signup.signup')}}
        </button>
      </div>
    </div>
    <div v-if="state.error" class="toast toast-end">
      <div class="alert alert-error">
        <div>
          <span>{{ $t('signup.error') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
