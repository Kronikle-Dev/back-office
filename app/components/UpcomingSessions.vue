<script lang="ts" setup>
import { DateTime } from 'luxon'

defineProps<{ sessions: KDateApiAug[] }>()

const fmtDay = (iso: string) =>
  DateTime.fromISO(iso).setLocale('fr-FR').toLocaleString({ weekday: 'long', day: 'numeric', month: 'long' })
const fmtTime = (iso: string) =>
  DateTime.fromISO(iso).setLocale('fr-FR').toLocaleString({ hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <section v-if="sessions.length" class="not-prose my-6">
    <h3 class="text-xl font-bold mb-3">{{ $t('event.index.upcoming.title') }}</h3>
    <ul class="flex flex-col gap-2">
      <li v-for="s in sessions" :key="s.$id">
        <NuxtLink :to="`/event/${s.event!.$id}`" class="card card-compact bg-white shadow hover:shadow-lg">
          <div class="card-body flex-row items-center gap-4">
            <div class="flex flex-col min-w-[10rem]">
              <span class="badge badge-primary badge-outline capitalize">{{ fmtDay(s.startDateTime) }}</span>
              <span class="text-sm opacity-70 mt-1">{{ fmtTime(s.startDateTime) }} – {{ fmtTime(s.endDateTime) }}</span>
            </div>
            <div class="flex flex-col grow">
              <span class="font-semibold">{{ s.event!.name }}</span>
              <span v-if="s.placeName" class="text-sm opacity-70">{{ s.placeName }}</span>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
