<script lang="ts" setup>
import {DateTime} from 'luxon'

const props = defineProps<{
  events: KEvent[],
  display: KDisplay,
  dates: KDate[]
}>()

useHead({
  htmlAttrs: {
    'data-theme': 'urfist',
  }
})

const state = reactive({
  tags: [] as string[]
})

function addTag (tag: string) {
  state.tags.push(tag)
}

function removeTag (tag: string) {
  state.tags.splice(state.tags.indexOf(tag), 1)
}

const beginOfToday = DateTime.fromObject({hour: 0, minute: 0, second: 0})
const endOfToday = DateTime.fromObject({hour: 23, minute: 59})
const beginOfWeek = DateTime.fromObject({weekday: 1})
const endOfWeek = DateTime.fromObject({weekday: 7, hour: 23, minute: 59})
const beginOfMonth = DateTime.fromObject({day: 1})
const endOfMonth = DateTime.fromObject({day: DateTime.now().daysInMonth, hour: 23, minute: 59})
console.log(beginOfMonth.toISO())
console.log(endOfMonth.toISO())

</script>

<template>
  <div class="bg-primary-200-kv3 h-screen flex flex-col">
    <TemplateExploreHeader :logo-url="'https://static.wikia.nocookie.net/valheim/images/5/52/Biome_meadows.png'" :corp-name="'URFIST de Bordeaux'" :display="props.display"></TemplateExploreHeader>
    <div class="grow overflow-y-scroll nobar flex flex-row space-x-32">
      <TemplateExploreThemePanel
        class="mt-6"
        @select="addTag"
        @deselect="removeTag"
        :display="display"
        :events="events">
      </TemplateExploreThemePanel>
      <div class="grow overflow-y-scroll nobar">
        <TemplateExploreEventCard v-for="event of props.events" :key="event.$id" :event="event">
        </TemplateExploreEventCard>
        <TemplateExploreEventCard v-for="event of props.events" :key="event.$id" :event="event">
        </TemplateExploreEventCard>
        <TemplateExploreEventCard v-for="event of props.events" :key="event.$id" :event="event">
        </TemplateExploreEventCard>
        <TemplateExploreEventCard v-for="event of props.events" :key="event.$id" :event="event">
        </TemplateExploreEventCard>
        <TemplateExploreEventCard v-for="event of props.events" :key="event.$id" :event="event">
        </TemplateExploreEventCard>
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
</style>
