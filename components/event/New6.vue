<script lang="ts" setup>
const props = defineProps<{
  event: any,
  dates: Array<any>,
  availableTags: Array<{$id: string, name: string}>,
  availablePublicTypes: Array<{$id: string, name: string}>,
  availableEventTypes:  Array<{$id: string, name: string}>,
}>()

const emit = defineEmits(['next', 'prev'])

const orderedDates = computed(() => {
  return props.dates.sort((a: any, b: any) => {
    return a.startDateTime - b.startDateTime
  }).map(d => {
    return {
      ...d,
      startDateTime: new Date(d.startDateTime),
      endDateTime: new Date(d.endDateTime)
    }
  })
})
const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
const timeOptions = { hour: 'numeric', minute: 'numeric' };

</script>

<template>
  <div>
    <div class="card bg-white not-prose">
      <figure><img :src="props.event.imageUrl" alt="Event image" /></figure>
      <div class="card-body">
        <h2 class="card-title">{{props.event.name}}</h2>
        <p>{{props.event.description}}</p>
        <div>
          <span v-for="tag of props.event.tags" :key="tag">#{{availableTags.find((t) => t.$id === tag)?.name}} </span>
        </div>
        <div class="grid sm:grid-cols-2 gap-y-8 grid-cols-1 mt-4">
        <div v-for="date of orderedDates" :key="`${date.$id}`" class="indicator">
          <div class="card w-64 bg-white shadow not-prose">
            <div class="card-body">
              <h2 class="card-title">{{date.startDateTime.toLocaleDateString(undefined, dateOptions)}} ({{date.startDateTime.toLocaleTimeString(undefined, timeOptions)}})</h2>
              <p>{{date.placeName}}, {{date.placeDescription}}.<br/>{{date.endDateTime.toLocaleDateString(undefined, dateOptions)}} ({{date.endDateTime.toLocaleTimeString(undefined, timeOptions)}})</p>
              <p>{{ date.attendanceMode }}</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    <div class="flex flex-row w-full space-x-4 pb-8">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="emit('prev')">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="emit('next')">{{$t('form.finish')}}</button>
    </div>
  </div>
</template>