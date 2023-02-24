<script lang="ts" setup>
const props = defineProps(['logoUrl', 'corpName', 'display', 'showBack'])
</script>

<template>
  <div class="w-full bg-primary-100-kv3 flex justify-between flex-row px-4 sm:px-16 pt-5 pb-4">
    <div class="flex flex-row space-x-6">
      <img :src="logoUrl" class="h-14 self-end" alt="Logo"/>
      <span class="font-black text-xl sm:text-4xl text-urfist-500 self-end">{{ corpName }}</span>
    </div>
    <div class="flex" v-if="showBack">
      <NuxtLink :to="`/d/${display.$id}`" class="text-base-100 flex flex-row space-x-2 self-end">
        <span>
          <svg class="text-urfist-200 w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.83088 17.9381V12.5215H12.1642V17.9381C12.1642 18.534 12.6517 19.0215 13.2475 19.0215H16.4975C17.0934 19.0215 17.5809 18.534 17.5809 17.9381V10.3548H19.4225C19.9209 10.3548 20.1592 9.7373 19.78 9.4123L10.7234 1.2548C10.3117 0.886463 9.68338 0.886463 9.27171 1.2548L0.215043 9.4123C-0.153291 9.7373 0.0742093 10.3548 0.572543 10.3548H2.41421V17.9381C2.41421 18.534 2.90171 19.0215 3.49754 19.0215H6.74754C7.34338 19.0215 7.83088 18.534 7.83088 17.9381Z" fill="currentColor"/>
          </svg>
        </span>
        <span class="hidden sm:inline" >
          {{ $t('displays.kronikle-v3.back-to-home') }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
