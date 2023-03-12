<script setup lang="ts">
import {DateTime} from 'luxon'

const props = defineProps<{
  event: KEvent | null,
  date: KDateApi,
}>()
</script>

<template>
  <div class="flex flex-col h-fit w-52 bg-primary-700-kv3 hover:bg-primary-900-kv3 rounded-lg cursor-pointer" v-if="event">
    <img class="h-28 rounded-t-lg object-cover" :src="event.imageUrl"/>
    <div class="p-2.5">
      <div class="font-semibold text-lg text-primary-100-kv3">{{ event.name }}</div>
      <div class="font-normal text-lg text-primary-100-kv3 flex flex-row items-center space-x-1">
        <svg class="w-4 h-4" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.25 3H13.5V1.5H12V3H6V1.5H4.5V3H3.75C2.9175 3 2.2575 3.675 2.2575 4.5L2.25 15C2.25 15.825 2.9175 16.5 3.75 16.5H14.25C15.075 16.5 15.75 15.825 15.75 15V4.5C15.75 3.675 15.075 3 14.25 3ZM14.25 15H3.75V7.5H14.25V15ZM6.75 10.5H5.25V9H6.75V10.5ZM9.75 10.5H8.25V9H9.75V10.5ZM12.75 10.5H11.25V9H12.75V10.5ZM6.75 13.5H5.25V12H6.75V13.5ZM9.75 13.5H8.25V12H9.75V13.5ZM12.75 13.5H11.25V12H12.75V13.5Z" fill="currentColor"/>
        </svg>
        <span class="capitalize">
          {{ DateTime.fromISO(date.startDateTime).setLocale('fr-FR').toLocaleString({weekday: 'long', month: 'long', day: 'numeric'}) }}
        </span>
      </div>
      <div class="font-normal text-lg text-primary-100-kv3 flex flex-row items-center space-x-1">
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.9925 0.5C3.8525 0.5 0.5 3.86 0.5 8C0.5 12.14 3.8525 15.5 7.9925 15.5C12.14 15.5 15.5 12.14 15.5 8C15.5 3.86 12.14 0.5 7.9925 0.5ZM8 14C4.685 14 2 11.315 2 8C2 4.685 4.685 2 8 2C11.315 2 14 4.685 14 8C14 11.315 11.315 14 8 14ZM8.375 4.25H7.25V8.75L11.1875 11.1125L11.75 10.19L8.375 8.1875V4.25Z" fill="currentColor"/>
        </svg>
        <span class="capitalize">
          {{ DateTime.fromISO(date.startDateTime).setLocale('fr-FR').toLocaleString({hour: '2-digit', minute: '2-digit'}) }} - {{ DateTime.fromISO(date.endDateTime).setLocale('fr-FR').toLocaleString({hour: '2-digit', minute: '2-digit'}) }}
        </span>
      </div>
    </div>
  </div>
</template>