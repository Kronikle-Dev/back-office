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
  dates: KDateApi[]
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
const endOfNextMonth = DateTime.fromObject({month: DateTime.now().month + 1, day: beginOfNextMonth.daysInMonth, hour: 23, minute: 59})

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

const augmentedDates = props.dates.map((d) => {
  (d as KDateApiAug).event = getEventForDate(d)
  return d
}) as KDateApiAug[]

const pastEvents = computed(() => {
  return augmentedDates.filter(date => {
    let hasTag = false
    if (state.tags.length === 0) return true
    date.event?.tags?.forEach(t => {
      if (state.tags.includes(t)) {
        hasTag = true
      }
    })
    return hasTag
  }).filter(date => {
    if (state.displayType == DisplayType.DAY) {
      return DateTime.fromISO(date.startDateTime) < beginOfToday
    } else if (state.displayType == DisplayType.WEEK) {
      return DateTime.fromISO(date.startDateTime) < beginOfWeek
    } else if (state.displayType == DisplayType.MONTH) {
      return DateTime.fromISO(date.startDateTime) < beginOfMonth
    }
  }).sort((a, b) => {
    return (new Date(a.startDateTime)).getTime() - (new Date(b.startDateTime)).getTime()
  })
})

const currentEvents = computed(() => {
  return augmentedDates.filter(date => {
    let hasTag = false
    if (state.tags.length === 0) return true
    date.event?.tags?.forEach(t => {
      if (state.tags.includes(t)) {
        hasTag = true
      }
    })
    return hasTag
  }).filter(date => {
    if (state.displayType == DisplayType.DAY) {
      return DateTime.fromISO(date.startDateTime) > beginOfToday && DateTime.fromISO(date.startDateTime) < endOfToday
    } else if (state.displayType == DisplayType.WEEK) {
      return DateTime.fromISO(date.startDateTime) > beginOfWeek && DateTime.fromISO(date.startDateTime) < endOfWeek
    } else if (state.displayType == DisplayType.MONTH) {
      return DateTime.fromISO(date.startDateTime) > beginOfMonth && DateTime.fromISO(date.startDateTime) < endOfMonth
    }
  }).sort((a, b) => {
    return (new Date(a.startDateTime)).getTime() - (new Date(b.startDateTime)).getTime()
  })
})

const nextEvents = computed(() => {
  return augmentedDates.filter(date => {
    let hasTag = false
    if (state.tags.length === 0) return true
    date.event?.tags?.forEach(t => {
      if (state.tags.includes(t)) {
        hasTag = true
      }
    })
    return hasTag
  }).filter(date => {
    if (state.displayType == DisplayType.DAY) {
      return DateTime.fromISO(date.startDateTime) > beginOfTomorrow && DateTime.fromISO(date.startDateTime) < endOfTomorrow
    } else if (state.displayType == DisplayType.WEEK) {
      return DateTime.fromISO(date.startDateTime) > beginOfNextWeek && DateTime.fromISO(date.startDateTime) < endOfNextWeek
    } else if (state.displayType == DisplayType.MONTH) {
      return DateTime.fromISO(date.startDateTime) > beginOfNextMonth && DateTime.fromISO(date.startDateTime) < endOfNextMonth
    }
  }).sort((a, b) => {
    return (new Date(a.startDateTime)).getTime() - (new Date(b.startDateTime)).getTime()
  })
})

const futureEvents = computed(() => {
  return augmentedDates.filter(date => {
    let hasTag = false
    if (state.tags.length === 0) return true
    date.event?.tags?.forEach(t => {
      if (state.tags.includes(t)) {
        hasTag = true
      }
    })
    return hasTag
  }).filter(date => {
    if (state.displayType == DisplayType.DAY) {
      return DateTime.fromISO(date.startDateTime) > endOfTomorrow
    } else if (state.displayType == DisplayType.WEEK) {
      return DateTime.fromISO(date.startDateTime) > endOfNextWeek
    } else if (state.displayType == DisplayType.MONTH) {
      return DateTime.fromISO(date.startDateTime) > endOfNextMonth
    }
  }).sort((a, b) => {
    return (new Date(a.startDateTime)).getTime() - (new Date(b.startDateTime)).getTime()
  })
}) 

onMounted(() => {
  document.getElementById('current-section')?.scrollIntoView()
})

</script>

<template>
  <div class="bg-primary-200-kv3 h-screen flex flex-col">
    <TemplateExploreHeader :logo-url="'https://static.wikia.nocookie.net/valheim/images/5/52/Biome_meadows.png'" :corp-name="'URFIST de Bordeaux'" :display="props.display" :show-back="false"></TemplateExploreHeader>
    <div class="grow overflow-y-scroll nobar flex flex-row space-x-10 sm:space-x-32">
      <TemplateExploreThemePanel
        class="mt-6"
        @select="addTag"
        @deselect="removeTag"
        :display="display"
        :events="events">
      </TemplateExploreThemePanel>
      <div class="grow overflow-y-scroll nobar">
        <div class="fixed pt-5 pb-5 consult-bg-gradient font-extrabold text-xl sm:text-4xl text-urfist-100 w-full">{{ $t('displays.kronikle-v3.consult-our-program') }}</div>
        <div class="flex flex-row flex-wrap w-full mt-16">
          <TemplateExploreEventCard class="mr-8 mt-8" v-for="date of pastEvents" :key="date.$id" :date="date" :event="date.event" @click="$router.push(`/d/${props.display.$id}/date/${date.$id}`)">
          </TemplateExploreEventCard>
        </div>
        <div id="current-section" v-if="state.displayType == DisplayType.DAY && currentEvents.length > 0" class="font-extrabold text-4xl text-urfist-100 pt-24">{{ $t('displays.kronikle-v3.today') }}</div>
        <div id="current-section" v-if="state.displayType == DisplayType.WEEK && currentEvents.length > 0" class="font-extrabold text-4xl text-urfist-100 pt-24">{{ $t('displays.kronikle-v3.this-week') }}</div>
        <div id="current-section" v-if="state.displayType == DisplayType.MONTH && currentEvents.length > 0" class="font-extrabold text-4xl text-urfist-100 pt-24">{{ $t('displays.kronikle-v3.this-month') }}</div>
        <div class="flex flex-row flex-wrap w-full">
          <TemplateExploreEventCard class="mr-8 mt-8" v-for="date of currentEvents" :key="date.$id" :date="date" :event="date.event" @click="$router.push(`/d/${props.display.$id}/date/${date.$id}`)">
          </TemplateExploreEventCard>
        </div>
        <div v-if="state.displayType == DisplayType.DAY && nextEvents.length > 0" class="font-extrabold text-4xl text-urfist-100 mt-16">{{ $t('displays.kronikle-v3.tomorrow') }}</div>
        <div v-if="state.displayType == DisplayType.WEEK && nextEvents.length > 0" class="font-extrabold text-4xl text-urfist-100 mt-16">{{ $t('displays.kronikle-v3.next-week') }}</div>
        <div v-if="state.displayType == DisplayType.MONTH && nextEvents.length > 0" class="font-extrabold text-4xl text-urfist-100 mt-16">{{ $t('displays.kronikle-v3.next-month') }}</div>
        <div class="flex flex-row flex-wrap w-full">
          <TemplateExploreEventCard class="mr-8 mt-8" v-for="date of nextEvents" :key="date.$id" :date="date" :event="date.event" @click="$router.push(`/d/${props.display.$id}/date/${date.$id}`)">
          </TemplateExploreEventCard>
        </div>
        <div class="font-extrabold text-4xl text-urfist-100 mt-16" v-if="futureEvents.length > 0">{{ $t('displays.kronikle-v3.future') }}</div>
        <div class="flex flex-row flex-wrap w-full">
          <TemplateExploreEventCard class="mr-8 mt-8" v-for="date of futureEvents" :key="date.$id" :date="date" :event="date.event" @click="$router.push(`/d/${props.display.$id}/date/${date.$id}`)">
          </TemplateExploreEventCard>
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
