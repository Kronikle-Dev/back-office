<script setup lang="ts">
const {$appwrite} = useNuxtApp()

const router = useRoute()
const userId = router.query.userId as string
const secret = router.query.secret as string
const verificationSuccess = ref('pending')

onMounted(async () => {
  const account = $appwrite().account
  try {
    const resp = await account.updateVerification(userId, secret)
    verificationSuccess.value = 'success'
    console.log(resp)
  } catch (error) {
    verificationSuccess.value = 'error'
    console.log(error)
  }
})
</script>

<template>
  <div>
    <div v-if="verificationSuccess == 'success'" class="max-w-lg mx-auto px-4 mt-20 prose">
      <h1>{{ $t('verify.title') }}</h1>
      <p>{{ $t('verify.text') }}</p>
      <nuxt-link to="/login" class="btn btn-primary">{{ $t('verify.login') }}</nuxt-link>
    </div>
    <div v-if="verificationSuccess == 'error'" class="max-w-lg mx-auto px-4 mt-20 prose">
      <h1>{{ $t('verify.title-error') }}</h1>
      <p>{{ $t('verify.text-error') }}</p>
      <a href="mailto:contact@kronikle.eu">{{ $t('verify.email-link-error') }}</a>
    </div>
  </div>
</template>