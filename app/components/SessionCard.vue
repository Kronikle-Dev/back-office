<script setup lang="ts">
// Carte d'une séance (document `date`) pour le back-office : fiche événement et
// récapitulatif de l'assistant. Chaque information n'est affichée que si elle est
// renseignée, pour éviter les « , . » et lignes vides quand le lieu manque.
const props = defineProps<{
  date: KDate | KDateApi,
}>()

const LOCALE = 'fr-FR'

const start = computed(() => new Date(props.date.startDateTime))
const end = computed(() => new Date(props.date.endDateTime))

const sameDay = computed(() => start.value.toDateString() === end.value.toDateString())

const weekday = computed(() => start.value.toLocaleDateString(LOCALE, { weekday: 'long' }))
const dayLabel = computed(() => start.value.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }))

function time (d: Date) {
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}
function shortDay (d: Date) {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' })
}

// Même jour : « 09:00 – 17:00 » ; sinon « du 14 mars 09:00 au 15 mars 17:00 ».
const timeLabel = computed(() => {
  if (sameDay.value) return `${time(start.value)} – ${time(end.value)}`
  return `${shortDay(start.value)} ${time(start.value)} → ${shortDay(end.value)} ${time(end.value)}`
})

const placeName = computed(() => (props.date.placeName ?? '').trim())
const placeDescription = computed(() => (props.date.placeDescription ?? '').trim())
const hasPlace = computed(() => placeName.value.length > 0 || placeDescription.value.length > 0)

const isOnline = computed(() => props.date.attendanceMode === 'online' || props.date.attendanceMode === 'mixed')
const isOnsite = computed(() => props.date.attendanceMode === 'offline' || props.date.attendanceMode === 'mixed')
const canceled = computed(() => props.date.status === 'canceled')

const capacity = computed(() => {
  const n = props.date.maxAttendeeCapacity
  return n !== null && n !== undefined && Number(n) > 0 ? Number(n) : null
})
const accessibility = computed(() => (props.date.accessibility ?? '').trim())
</script>

<template>
  <div class="card bg-white shadow not-prose" :class="{ 'opacity-60': canceled }">
    <div class="card-body p-5 gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-xs uppercase tracking-wide text-base-content/60">{{ weekday }}</div>
          <h3 class="card-title text-lg leading-tight" :class="{ 'line-through': canceled }">{{ dayLabel }}</h3>
        </div>
        <span v-if="canceled" class="badge badge-error badge-sm shrink-0">{{ $t('event.session.canceled') }}</span>
      </div>

      <div class="flex items-center gap-2 text-sm">
        <svg class="w-4 h-4 shrink-0 text-base-content/60" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7.9925 0.5C3.8525 0.5 0.5 3.86 0.5 8C0.5 12.14 3.8525 15.5 7.9925 15.5C12.14 15.5 15.5 12.14 15.5 8C15.5 3.86 12.14 0.5 7.9925 0.5ZM8 14C4.685 14 2 11.315 2 8C2 4.685 4.685 2 8 2C11.315 2 14 4.685 14 8C14 11.315 11.315 14 8 14ZM8.375 4.25H7.25V8.75L11.1875 11.1125L11.75 10.19L8.375 8.1875V4.25Z"/>
        </svg>
        <span>{{ timeLabel }}</span>
      </div>

      <div v-if="hasPlace" class="flex items-start gap-2 text-sm">
        <svg class="w-4 h-4 shrink-0 mt-0.5 text-base-content/60" viewBox="0 0 17 26" fill="currentColor" aria-hidden="true">
          <path d="M8.50002 0.916687C3.82377 0.916687 0.041687 4.69877 0.041687 9.37502C0.041687 15.7188 8.50002 25.0834 8.50002 25.0834C8.50002 25.0834 16.9584 15.7188 16.9584 9.37502C16.9584 4.69877 13.1763 0.916687 8.50002 0.916687ZM8.50002 12.3959C6.83252 12.3959 5.47919 11.0425 5.47919 9.37502C5.47919 7.70752 6.83252 6.35419 8.50002 6.35419C10.1675 6.35419 11.5209 7.70752 11.5209 9.37502C11.5209 11.0425 10.1675 12.3959 8.50002 12.3959Z"/>
        </svg>
        <div class="min-w-0">
          <div v-if="placeName" class="font-medium break-words">{{ placeName }}</div>
          <div v-if="placeDescription" class="text-base-content/70 break-words">{{ placeDescription }}</div>
        </div>
      </div>
      <div v-else-if="!isOnline" class="flex items-center gap-2 text-sm text-base-content/50 italic">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 17 26" fill="currentColor" aria-hidden="true">
          <path d="M8.50002 0.916687C3.82377 0.916687 0.041687 4.69877 0.041687 9.37502C0.041687 15.7188 8.50002 25.0834 8.50002 25.0834C8.50002 25.0834 16.9584 15.7188 16.9584 9.37502C16.9584 4.69877 13.1763 0.916687 8.50002 0.916687ZM8.50002 12.3959C6.83252 12.3959 5.47919 11.0425 5.47919 9.37502C5.47919 7.70752 6.83252 6.35419 8.50002 6.35419C10.1675 6.35419 11.5209 7.70752 11.5209 9.37502C11.5209 11.0425 10.1675 12.3959 8.50002 12.3959Z"/>
        </svg>
        <span>{{ $t('event.session.no-place') }}</span>
      </div>

      <div v-if="isOnsite || isOnline || date.mandatoryRegistration || capacity || accessibility" class="flex flex-wrap gap-1.5">
        <span v-if="isOnsite" class="badge badge-outline badge-sm">{{ $t('event.session.onsite') }}</span>
        <span v-if="isOnline" class="badge badge-outline badge-sm">{{ $t('event.session.online') }}</span>
        <span v-if="date.mandatoryRegistration" class="badge badge-primary badge-outline badge-sm">{{ $t('event.session.registration-required') }}</span>
        <span v-if="capacity" class="badge badge-ghost badge-sm">{{ $t('event.session.capacity', { n: capacity }) }}</span>
        <span v-if="accessibility" class="badge badge-ghost badge-sm max-w-full truncate" :title="accessibility">♿ {{ accessibility }}</span>
      </div>
    </div>
  </div>
</template>
