<script lang="ts" setup>
// Calendrier de la page d'accueil (SVAR Vue Calendar, édition MIT).
// - Un clic sur une séance ouvre la fiche de l'événement.
// - Le glisser-déposer / redimensionnement d'une séance met à jour le document
//   `date` dans Appwrite ; en cas d'échec la séance revient à sa place.
// - Création et suppression de séances depuis le calendrier sont bloquées.
// Composant client-only (suffixe .client) : SVAR mesure le DOM au montage.
import { Databases } from 'appwrite'
import { Calendar, Willow, getToolbarItems } from '@svar-ui/vue-calendar'
import type { CalendarInstanceApi } from '@svar-ui/vue-calendar'
import { Locale } from '@svar-ui/vue-core'
import { fr as frCalendar } from '@svar-ui/calendar-locales'
import { fr as frCore } from '@svar-ui/core-locales'
import '@svar-ui/vue-calendar/all.css'
import HomeCalendarEvent from '~/components/HomeCalendarEvent.vue'

const props = defineProps<{ sessions: KDateApiAug[] }>()
const emit = defineEmits<{
  (e: 'updated', payload: { id: string, startDateTime: string, endDateTime: string }): void
  (e: 'error', message: string): void
}>()

const { $appwrite } = useNuxtApp()
const { t } = useI18n()

// `:fonts="false"` sur Willow évite de charger Open Sans (on garde la police de
// l'app) mais désactive aussi la police d'icônes de la barre d'outils, qui n'est
// pas embarquée dans le paquet : on ne charge que celle-ci.
useHead({
  link: [{ rel: 'stylesheet', href: 'https://cdn.svar.dev/fonts/wxi/wx-icons.css' }],
})

// Locale française ; `calendar.weekStart` vaut 1 (lundi) par défaut.
const words = { ...frCore, ...frCalendar }
// Barre d'outils sans le bouton « + » (pas de création depuis le calendrier).
// La déclaration de types annonce `buttons`, mais le bundle 2.7.0 lit `items`.
const toolbar = { items: getToolbarItems().filter(i => i.id !== 'add-event') } as any
// Les vues semaine/jour couvrent par défaut 8 h → 18 h : on affiche la journée
// entière pour ne pas cacher les séances du soir.
const fullDay = { sections: { timeGrid: { yScale: { startHour: 0, endHour: 24 } } } }
const views = ['month', { id: 'week', ...fullDay }, { id: 'day', ...fullDay }]
const today = new Date()

// KDateApiAug -> événement SVAR (instances Date, pas de chaînes ISO).
const events = computed(() => props.sessions
  .filter(d => d.event && d.$id)
  .map(d => ({
    id: d.$id as string,
    start: new Date(d.startDateTime),
    end: new Date(d.endDateTime),
    text: d.event!.name,
    eventId: d.event!.$id as string,
  })))

// Un drop peut être suivi d'un `select-event` : on ignore ceux qui suivent de près.
let lastDropAt = 0

function init(api: CalendarInstanceApi) {
  api.intercept('add-event', () => false)
  api.intercept('delete-event', () => false)

  api.on('select-event', ({ id }: { id?: string | number }) => {
    if (id === undefined || id === null) return
    if (Date.now() - lastDropAt < 300) return
    const ev = events.value.find(e => e.id === String(id))
    if (ev) navigateTo(`/event/${ev.eventId}`)
  })

  // Au relâchement d'un glisser-déposer ou d'un redimensionnement, SVAR 2.7
  // dispatch `move-event` avec les dates finales (et non `update-event`, réservé
  // à l'éditeur). Les étapes intermédiaires du drag n'ont pas de `event`.
  api.on('move-event', async ({ id, event }: { id: string | number, event?: { start?: Date, end?: Date } }) => {
    if (!event || (!event.start && !event.end)) return
    const key = String(id)
    lastDropAt = Date.now()

    const prev = props.sessions.find(s => s.$id === key)
    if (!prev) return
    const start: Date = event.start ?? new Date(prev.startDateTime)
    const end: Date = event.end ?? new Date(prev.endDateTime)

    // Le revert passe par `update-event`, qui ne repasse pas par ce gestionnaire.
    const revert = () => {
      api.exec('update-event', {
        id,
        event: { start: new Date(prev.startDateTime), end: new Date(prev.endDateTime) },
      })
    }

    if (end.getTime() <= start.getTime()) {
      revert()
      emit('error', t('event.index.calendar.invalid-range'))
      return
    }

    try {
      await new Databases($appwrite().client).updateDocument('kronikle', 'date', key, {
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      })
      emit('updated', { id: key, startDateTime: start.toISOString(), endDateTime: end.toISOString() })
    } catch (e) {
      console.error('Failed to move date : ', e)
      revert()
      emit('error', t('event.index.calendar.update-error'))
    }
  })
}
</script>

<template>
  <div class="not-prose h-[42rem] card bg-base-100 shadow rounded-lg overflow-hidden">
    <Willow :fonts="false">
      <Locale :words="words">
        <Calendar
          :events="events"
          :date="today"
          view="month"
          :views="views"
          :toolbar="toolbar"
          :init="init"
          :eventContent="HomeCalendarEvent"
          :eventCss="() => 'cursor-pointer'" />
      </Locale>
    </Willow>
  </div>
</template>
