<script lang="ts" setup>
import {DateTime} from 'luxon'

enum DisplayType {
  DAY = 1,
  WEEK,
  MONTH
}

const props = defineProps<{
  events: KEvent[],
  display: KDisplay,
  dates: KDateApi[],
  event: KEvent
}>()

useHead({
  htmlAttrs: {
    'data-theme': 'urfist',
  }
})

const state = reactive({
  tags: [] as string[],
  displayType: DisplayType.MONTH,
  pastEvents: [] as KDateApi[],
  currentEvents: [] as KDateApi[],
  nextEvents: [] as KDateApi[],
  futureEvents: [] as KDateApi[]
})

function getEventForDate (date: KDateApi) : KEvent  | null {
  return props.events.find((e) => e.$id == date.eventId) || null
}

function addTag (tag: string) {
  state.tags.push(tag)
}

function removeTag (tag: string) {
  state.tags.splice(state.tags.indexOf(tag), 1)
}

// BEGIN Détermination du mode d'affichage des événement : day, week, ou month (défaut)
const beginOfToday = DateTime.fromObject({hour: 0, minute: 0, second: 0})
const endOfToday = DateTime.fromObject({hour: 23, minute: 59})
const beginOfWeek = DateTime.fromObject({weekday: 1})
const endOfWeek = DateTime.fromObject({weekday: 7, hour: 23, minute: 59})
const beginOfMonth = DateTime.fromObject({day: 1})
const endOfMonth = DateTime.fromObject({day: DateTime.now().daysInMonth, hour: 23, minute: 59})

const beginOfTomorrow = DateTime.fromObject({day: DateTime.now().day + 1, hour: 0, minute: 0, second: 0})
const endOfTomorrow = DateTime.fromObject({day: DateTime.now().day + 1, hour: 23, minute: 59})
const beginOfNextWeek = DateTime.fromObject({weekNumber: DateTime.now().weekNumber + 1, weekday: 1})
const endOfNextWeek = DateTime.fromObject({weekNumber: DateTime.now().weekNumber + 1, weekday: 7, hour: 23, minute: 59})
const beginOfNextMonth = DateTime.fromObject({month: DateTime.now().month + 1, day: 1})
const endOfNextMonth = DateTime.fromObject({month: DateTime.now().month + 1, day: DateTime.now().daysInMonth, hour: 23, minute: 59})

const numberOfDatesWeek = props.dates.filter((date => {
  const dateStart = DateTime.fromISO(date.startDateTime)
  return dateStart >= beginOfWeek && dateStart <= endOfWeek
})).length

const numberOfDatesMonth = props.dates.filter((date => {
  const dateStart = DateTime.fromISO(date.startDateTime)
  return dateStart >= beginOfMonth && dateStart <= endOfMonth
})).length

if (numberOfDatesMonth > 8) {
  state.displayType = DisplayType.WEEK
}

if (numberOfDatesWeek > 8) {
  state.displayType = DisplayType.DAY
}
// END Détermination

state.pastEvents = props.dates.filter(date => {
  if (state.displayType == DisplayType.DAY) {
    return DateTime.fromISO(date.startDateTime) < beginOfToday
  } else if (state.displayType == DisplayType.WEEK) {
    return DateTime.fromISO(date.startDateTime) < beginOfWeek
  } else if (state.displayType == DisplayType.MONTH) {
    return DateTime.fromISO(date.startDateTime) < beginOfMonth
  }
})

state.currentEvents = props.dates.filter(date => {
  if (state.displayType == DisplayType.DAY) {
    return DateTime.fromISO(date.startDateTime) > beginOfToday && DateTime.fromISO(date.startDateTime) < endOfToday
  } else if (state.displayType == DisplayType.WEEK) {
    return DateTime.fromISO(date.startDateTime) > beginOfWeek && DateTime.fromISO(date.startDateTime) < endOfWeek
  } else if (state.displayType == DisplayType.MONTH) {
    return DateTime.fromISO(date.startDateTime) > beginOfMonth && DateTime.fromISO(date.startDateTime) < endOfMonth
  }
})

state.nextEvents = props.dates.filter(date => {
  if (state.displayType == DisplayType.DAY) {
    return DateTime.fromISO(date.startDateTime) > beginOfTomorrow && DateTime.fromISO(date.startDateTime) < endOfTomorrow
  } else if (state.displayType == DisplayType.WEEK) {
    return DateTime.fromISO(date.startDateTime) > beginOfNextWeek && DateTime.fromISO(date.startDateTime) < endOfNextWeek
  } else if (state.displayType == DisplayType.MONTH) {
    return DateTime.fromISO(date.startDateTime) > beginOfNextMonth && DateTime.fromISO(date.startDateTime) < endOfNextMonth
  }
})

state.futureEvents = props.dates.filter(date => {
  if (state.displayType == DisplayType.DAY) {
    return DateTime.fromISO(date.startDateTime) > endOfTomorrow
  } else if (state.displayType == DisplayType.WEEK) {
    return DateTime.fromISO(date.startDateTime) > endOfNextWeek
  } else if (state.displayType == DisplayType.MONTH) {
    return DateTime.fromISO(date.startDateTime) > endOfNextMonth
  }
})

</script>

<template>
  <div class="bg-urfist-300 h-screen flex flex-col">
    <TemplateExploreHeader :logo-url="'https://static.wikia.nocookie.net/valheim/images/5/52/Biome_meadows.png'" :corp-name="'URFIST de Bordeaux'" :display="props.display" :show-back="true"></TemplateExploreHeader>
    <div class="grow overflow-y-scroll nobar flex flex-row space-x-32">
      <TemplateExploreSearchPanel
        class="mt-6"
        @select="addTag"
        @deselect="removeTag"
        :display="display"
        :events="events">
      </TemplateExploreSearchPanel>
      <div class="grow overflow-y-scroll nobar">
        <div class="pt-5 font-extrabold text-3xl text-primary-200-kv3 pb-5">{{ $t('displays.kronikle-v3.event-sheet') }}</div>
        <div class="rounded-lg p-7 bg-urfist-200 max-w-2xl">
          <h1 class="font-bold text-2xl text-primary-100-kv3">{{ props.event.name }}</h1>
          <div class="grid grid-cols-2 gap-x-5 mt-5">
            <img :src="props.event.imageUrl"/>
            <div>
              <div>08 février 2023</div>
              <div>18:00 - 20:00</div>
              <div>Bibliothèque Mériadeck</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
 /* Hide scrollbar for Chrome, Safari and Opera */
 .nobar::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.nobar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
} 

.consult-bg-gradient {
  background: linear-gradient(0deg, rgba(2,0,36,0) 0%, rgba(36,47,70,1) 24%, rgba(36,47,70,1) 100%);
}
</style>
