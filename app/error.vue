<script lang="ts" setup>
defineProps<{
  error: {
    statusCode: number
    statusMessage: string
    message: string
  }
}>()
</script>

<template>
  <div class="max-w-xl mx-auto prose text-center py-20">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.statusMessage || error.message || $t('error.title') }}</p>
    <NuxtLink to="/" class="btn btn-primary">{{ $t('error.go-back') }}</NuxtLink>
  </div>
</template>
