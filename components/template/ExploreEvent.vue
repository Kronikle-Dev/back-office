<script lang="ts" setup>
import { Databases, Query, Avatars } from 'appwrite'
import {DateTime} from 'luxon'
const {$appwrite} = useNuxtApp()
const databases = new Databases($appwrite().client)
const avatars = new Avatars($appwrite().client)
//@ts-ignore
import showdown from 'showdown'

const converter = new showdown.Converter()

enum DisplayType {
  DAY = 1,
  WEEK,
  MONTH
}

const props = defineProps<{
  events: KEvent[],
  display: KDisplay,
  dates: KDateApi[],
  event: KEvent,
  date: KDateApi,
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
  futureEvents: [] as KDateApi[],
  hideDescription: true
})

const eventTypes = ref([] as unknown as {$id: string, name: string}[])

$appwrite().getAllPages('kronikle', 'event-type',
  [
    Query.equal('$id', [...props.event?.eventType as string[]])
  ]).then(docs => {
    eventTypes.value.push(...docs as unknown as {$id: string, name: string}[])
  }).catch(e => {
    console.log('Event has no type assigned')
  })


const eventTags = ref([] as unknown as {$id: string, name: string}[])

$appwrite().getAllPages('kronikle', 'tag',
  [
    Query.equal('$id', [...props.event.tags as string[]])
  ]).then(docs => {
    eventTags.value.push(...docs as unknown as {$id: string, name: string}[])
  }).catch(e => {
    console.log('Event has no tags assigned')
  })

const eventResources = ref([] as KResource[])

$appwrite().getAllPages('kronikle', 'resource',
  [
    Query.equal('eventId', props.event.$id as string)
  ]).then(docs => {
    eventResources.value.push(...docs as unknown as KResource[])
  })


const qrUrl = ref(avatars.getQR(`https://app.kronikle.eu/dq/${props.display.$id}`).toString())
const qrUrlTarget = ref('')

const resourceLabels = computed(() => {
  const labels = new Set<string>()
  eventResources.value.map(r => r.tags.map(t => labels.add(t)))
  return labels
})

const orderedResources = computed(() => {
  const oresources = {}
  for (const res of eventResources.value) {
    for (const tag of res.tags) {
      // @ts-ignore
      if (oresources[tag] === undefined) {
      // @ts-ignore
      oresources[tag] = []
      }
      // @ts-ignore
      oresources[tag].push(res)
    }
  }
  return oresources
})

const noTagResources = computed(() => {
  return eventResources.value.filter(res => res.tags.length === 0)
})

const datePlace = computed(() => {
  switch (props.date.attendanceMode) {
    case 'online': 
      return useI18n().t('displays.kronikle-v3.online')
    case 'offline':
      return props.date.placeName
    case 'mixed':
      return props.date.placeName + useI18n().t('displays.kronikle-v3.and-online')
  }
})

function getEventForDate (date: KDateApi) : KEvent  | null {
  return props.events.find((e) => e.$id == date.eventId) || null
}

const augmentedDates = props.dates.sort((a, b) => {
    return (new Date(a.startDateTime)).getTime() - (new Date(b.startDateTime)).getTime()
  }).map((d) => {
  (d as KDateApiAug).event = getEventForDate(d)
  if (d != null) {
    return d
  } else {
    return
  }
}) as KDateApiAug[]


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

const htmlDescription = converter.makeHtml(props.event.description)

onMounted(() => {
  qrUrlTarget.value = `${window.location.hostname}/dq/${props.display.$id}/date/${props.date.$id}`
  qrUrl.value = avatars.getQR(`${window.location.origin}/dq/${props.display.$id}/date/${props.date.$id}`).toString()
})

</script>

<template>
  <div class="bg-urfist-800 h-screen flex flex-col">
    <TemplateExploreHeader :logo-url="'/urfist_bordeaux_blanc-logo 1.png'" :corp-name="'URFIST de Bordeaux'" :display="props.display" :show-back="true"></TemplateExploreHeader>
    <div class="grow overflow-y-scroll nobar flex flex-row space-x-32">
      <TemplateExploreSearchPanel
        class="mt-6 grow-0"
        @select="addTag"
        @deselect="removeTag"
        :current-date="props.date"
        :display="props.display"
        :dates="augmentedDates"
        :events="props.events">
      </TemplateExploreSearchPanel>
      <div class="grow overflow-y-scroll nobar">
        <div class="pt-5 font-extrabold text-3xl text-primary-200-kv3 pb-5">{{ $t('displays.kronikle-v3.event-sheet') }}</div>
        <div class="flex flex-row flex-wrap space-y-7 items-end">
          <div class="rounded-lg p-7 mr-7 bg-urfist-200 max-w-2xl">
            <h1 class="font-bold text-2xl text-primary-100-kv3">{{ props.event.name }}</h1>
            <div class="grid grid-cols-2 gap-x-5 gap-y-5 mt-5">
              <img :src="props.event.imageUrl"/>
              <div class="flex flex-col space-y-2.5">
                <div class="flex flex-row space-x-1">
                  <svg class="text-primary-200-kv3 w-5 min-w-[1.25rem]" viewBox="0 0 23 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.9583 3.33335H18.75V0.916687H16.3333V3.33335H6.66667V0.916687H4.25V3.33335H3.04167C1.70042 3.33335 0.637083 4.42085 0.637083 5.75002L0.625 22.6667C0.625 23.9959 1.70042 25.0834 3.04167 25.0834H19.9583C21.2875 25.0834 22.375 23.9959 22.375 22.6667V5.75002C22.375 4.42085 21.2875 3.33335 19.9583 3.33335ZM19.9583 22.6667H3.04167V10.5834H19.9583V22.6667ZM7.875 15.4167H5.45833V13H7.875V15.4167ZM12.7083 15.4167H10.2917V13H12.7083V15.4167ZM17.5417 15.4167H15.125V13H17.5417V15.4167ZM7.875 20.25H5.45833V17.8334H7.875V20.25ZM12.7083 20.25H10.2917V17.8334H12.7083V20.25ZM17.5417 20.25H15.125V17.8334H17.5417V20.25Z" fill="currentColor"/>
                  </svg>
                  <span class="font-bold text-lg text-primary-100-kv3">
                    {{ DateTime.fromISO(props.date.startDateTime).setLocale('fr-FR').toLocaleString({day: '2-digit', month: 'long', year: 'numeric'}) }}
                  </span>
                </div>
                <div class="flex flex-row space-x-1">
                  <svg class="text-primary-200-kv3 w-5 min-w-[1.25rem]" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.4879 0.916687C5.81794 0.916687 0.416687 6.33002 0.416687 13C0.416687 19.67 5.81794 25.0834 12.4879 25.0834C19.17 25.0834 24.5834 19.67 24.5834 13C24.5834 6.33002 19.17 0.916687 12.4879 0.916687ZM12.5 22.6667C7.15919 22.6667 2.83335 18.3409 2.83335 13C2.83335 7.65919 7.15919 3.33335 12.5 3.33335C17.8409 3.33335 22.1667 7.65919 22.1667 13C22.1667 18.3409 17.8409 22.6667 12.5 22.6667ZM13.1042 6.95835H11.2917V14.2084L17.6354 18.0146L18.5417 16.5284L13.1042 13.3021V6.95835Z" fill="currentColor"/>
                  </svg>
                  <span class="font-bold text-lg text-primary-100-kv3">
                    {{ DateTime.fromISO(props.date.startDateTime).setLocale('fr-FR').toLocaleString({hour: '2-digit', minute: '2-digit'}) }} - {{ DateTime.fromISO(props.date.endDateTime).setLocale('fr-FR').toLocaleString({hour: '2-digit', minute: '2-digit'}) }}
                  </span>
                </div>
                <div class="flex flex-row space-x-1">
                  <svg class="text-primary-200-kv3 w-5 min-w-[1.25rem] h-6" viewBox="0 0 17 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.50002 0.916687C3.82377 0.916687 0.041687 4.69877 0.041687 9.37502C0.041687 15.7188 8.50002 25.0834 8.50002 25.0834C8.50002 25.0834 16.9584 15.7188 16.9584 9.37502C16.9584 4.69877 13.1763 0.916687 8.50002 0.916687ZM8.50002 12.3959C6.83252 12.3959 5.47919 11.0425 5.47919 9.37502C5.47919 7.70752 6.83252 6.35419 8.50002 6.35419C10.1675 6.35419 11.5209 7.70752 11.5209 9.37502C11.5209 11.0425 10.1675 12.3959 8.50002 12.3959Z" fill="currentColor"/>
                  </svg>
                  <span class="font-bold text-lg text-primary-100-kv3">
                    {{ datePlace }}
                  </span>
                </div>
              </div>
              <div>
                <div>
                  <TemplateExploreEventTypeButton
                      class="mr-2.5 mt-2.5"
                    v-for="type of eventTypes"
                    :key="type.$id"
                    :type-name="type.name"
                    :type-id="type.$id">
                  </TemplateExploreEventTypeButton>
                  <div class="flex flex-row flex-wrap">
                    <TemplateExploreThemeTagButton
                      class="mr-2.5 mt-2.5"
                      v-for="type of eventTags"
                      :key="type.$id"
                      :tag-name="type.name"
                      :tag-id="type.$id">
                    </TemplateExploreThemeTagButton>
                  </div>
                </div>
              </div>
              <div class="text-lg">
                <div class="font-semibold">{{ $t('displays.kronikle-v3.description') }}</div>
                <div class="overflow-clip" :class="{'max-h-full': !state.hideDescription, 'max-h-[5.25rem]': state.hideDescription}" v-html="htmlDescription"></div>
                
                <div class="text-lg underline cursor-pointer mt-4">
                  <a v-if="state.hideDescription" @click="state.hideDescription = false">{{ $t('displays.kronikle-v3.click-to-expand') }}</a>
                  <a v-else @click="state.hideDescription = true">{{ $t('displays.kronikle-v3.click-to-retract') }}</a>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col h-full">
            <div class="hidden sm:block bg-urfist-200 py-8 px-8 text-center w-72 rounded-lg">
              <div class="font-semibold text-lg leading-none text-primary-200-kv3 mb-3">{{ $t('displays.kronikle-v3.find-page-on-phone-qr') }}</div>
              <img class="w-36 h-36 m-auto border-4" :src="qrUrl" />
              <!--<div class="underline text-primary-200-kv3 font-light text-lg mt-1">{{ qrUrlTarget }}</div>-->
            </div>
            <div v-if="resourceLabels.size > 0" class="bg-urfist-300 max-w-md mt-7 w-full rounded-lg p-6 font-normal text-xl grow">
              <div class="font-bold text-2xl">{{ $t('displays.kronikle-v3.index') }}</div>
              <ul>
                <li v-for="label of resourceLabels" :key="label" class="underline"><a :href="`#${label}`">{{ label }}</a></li>
              </ul>
            </div>
          </div>
        </div>
          <div>
            <TemplateExploreResourceFolder v-for="(value, key) in orderedResources"
                :key="key"
                :id="key"
                :resources="value"
                :label="key"
                class="mt-10">
            </TemplateExploreResourceFolder>
            <TemplateExploreResourceFolder 
                v-if="noTagResources.length > 0"
                :resources="noTagResources"
                :label="''"
                class="mt-10">
            </TemplateExploreResourceFolder>
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
