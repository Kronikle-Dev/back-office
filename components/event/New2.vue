<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { required, minLength, maxLength, integer } from '@vuelidate/validators'
import 'v-calendar/dist/style.css';
import {ID} from 'appwrite'
import { DateTimeFormatOptions } from '@intlify/core-base'
import Appwrite from '~~/utils/appwrite'
import { Databases } from 'appwrite'

const databases = new Databases(Appwrite.client)


const emit = defineEmits(['next', 'prev'])

const props = defineProps(['event', 'dates'])

const showSecondCalendar = ref(false)
 
const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' } as DateTimeFormatOptions
const timeOptions = { hour: 'numeric', minute: 'numeric' } as DateTimeFormatOptions

const state = reactive({
  dates: props.dates as Array<KDate>,
  placeName: '',
  placeDescription: '',
  startTime: new Date((new Date()).setMinutes(0)),
  endTime: new Date((new Date((new Date()).setTime((new Date()).getTime() + 3600000))).setMinutes(0)),
  maxAttendeeCapacity: null,
  mandatoryRegistration: false,
  accessibility: '',
  attendanceMode: '',
  isOffline: true,
  isOnline: false,
})

const orderedDates = computed(() => {
  return state.dates.sort((a: any, b: any) => {
    return a.startDateTime - b.startDateTime
  }).map(d => {
    return {
      ...d,
      startDateTime: new Date(d.startDateTime),
      endDateTime: new Date(d.endDateTime)
    }
  })
})

watch(() => state.startTime, (newVal, oldVal) => {
  if (newVal > state.endTime) {
    state.endTime = new Date((new Date(newVal)).setTime((new Date(newVal)).getTime() + 3600000))
  }
})

const rulesDate = {
  placeName: {
    maxLength: maxLength(200),
  },
  placeDescription: {
    maxLength: maxLength(500),
  },
  maxAttendeeCapacity: {
    integer,
  },
}


const rulesEvent = {
  dates: {
    required,
    minLength: minLength(1),
  },
}
const vd$ = useVuelidate(rulesDate, state)
const v$ = useVuelidate(rulesEvent, state)

async function next () {
  const formValid = await v$.value.$validate()
  if (!formValid) {
    console.log('form not valid')
    return
  }
  emit('next', state.dates)
}

async function addDate() {
  const formValid = await vd$.value.$validate()
  if (!formValid) {
    console.log('form not valid')
    return
  }
  let attendanceMode = ''
  if (state.isOffline && state.isOnline) {
    attendanceMode = 'mixed'
  } else if (state.isOffline) {
    attendanceMode = 'offline'
  } else if (state.isOnline) {
    attendanceMode = 'online'
  } else {
    attendanceMode = 'offline'
  }
  state.dates.push({
    $id: `${Date.now()}`,
    eventId: '',
    status: 'valid',
    startDateTime: state.startTime,
    endDateTime: state.endTime,
    placeName: state.placeName,
    placeDescription: state.placeDescription,
    maxAttendeeCapacity: state.maxAttendeeCapacity,
    mandatoryRegistration: state.mandatoryRegistration,
    accessibility: state.accessibility,
    attendanceMode: attendanceMode,
    new: true,
  })
  state.startTime = new Date((new Date()).setMinutes(0))
  state.endTime = new Date((new Date((new Date()).setTime((new Date()).getTime() + 3600000))).setMinutes(0))
  state.placeName = ''
  state.placeDescription = ''
  state.maxAttendeeCapacity = null
  state.mandatoryRegistration = false
  state.accessibility = ''
  state.attendanceMode = ''
  state.isOffline = true
  state.isOnline = false
}

function deleteDate(id: string | undefined) {
  if (!id) return
  state.dates = state.dates.filter((date: any) => date.$id !== id)
}

function cancelDate (id: string | undefined) {
  let date = state.dates.find(d => d.$id == id)
  if (date) {
    date.status = 'canceled'
    databases.updateDocument('kronikle', 'date', id as string, {
      status: 'canceled'
    })
  }
}

function reinstateDate (id: string | undefined) {
  let date = state.dates.find(d => d.$id == id)
  if (date) {
    date.status = 'valid'
    databases.updateDocument('kronikle', 'date', id as string, {
      status: 'valid'
    })
  }
}
function cloneDate(date: any) {
  state.startTime = date.startDateTime
  state.endTime = date.endDateTime
  state.placeName = date.placeName
  state.placeDescription = date.placeDescription
  state.maxAttendeeCapacity = date.maxAttendeeCapacity
  state.mandatoryRegistration = date.mandatoryRegistration
  state.accessibility = date.accessibility
  state.attendanceMode = date.attendanceMode
  state.isOffline = date.attendanceMode == 'mixed' || date.attendanceMode == 'offline'
  state.isOnline = date.attendanceMode == 'mixed' || date.attendanceMode == 'online'
}

</script>

<template>
  <div>
    <h2>{{$t('event.newtwo.title')}}</h2>
    <p>{{$t('event.newtwo.subtitle')}}</p>
    <div class="grid sm:grid-cols-2 gap-y-8 grid-cols-1 mb-10">
      <div v-for="date of orderedDates" :key="`${date.$id}`" class="indicator">
        <span v-if="date.new" class="indicator-item badge badge-primary cursor-pointer" @click="deleteDate(date.$id)">{{$t('event.newtwo.delete')}}</span> 
        <span v-else class="indicator-item badge badge-primary cursor-pointer" @click="cancelDate(date.$id)">{{$t('event.newtwo.cancel')}}</span>
        <span v-if="date.status == 'canceled'" class="indicator-item badge badge-primary cursor-pointer" @click="reinstateDate(date.$id)">{{$t('event.newtwo.reinstate')}}</span> 
        <span class="indicator-item indicator-bottom badge badge-success cursor-pointer" @click="cloneDate(date)">{{$t('event.newtwo.clone')}}</span> 
        <div class="card w-64 bg-white shadow not-prose" :class="{'card-bordered border-4 border-error': date.status == 'canceled'}">
          <span v-if="date.status == 'canceled'" class="absolute t-0 l-0 text-error -rotate-45 -translate-x-8">CANCELLED</span>
          <div class="card-body">
            <h2 class="card-title">{{date.startDateTime.toLocaleDateString(undefined, dateOptions)}} ({{date.startDateTime.toLocaleTimeString(undefined, timeOptions)}})</h2>
            <p>{{date.placeName}}, {{date.placeDescription}}.<br/>{{date.endDateTime.toLocaleDateString(undefined, dateOptions)}} ({{date.endDateTime.toLocaleTimeString(undefined, timeOptions)}})</p>
          </div>
        </div>
      </div>
    </div>
      <div class="flex flex-row space-x-4 not-prose">
        <div>
          <label class="label">
            <span class="label-text">{{$t('event.newtwo.startdate-label')}}</span>
          </label>
          <ClientOnly fallbackTag="span">
            <template #fallback>
              <p>...</p>
            </template>
            <v-date-picker v-model="state.startTime" is-required>
            </v-date-picker>
          </ClientOnly>
        </div>
        <div class="flex flex-col space-y-2">
          <div>
            <label class="label">
              <span class="label-text">{{$t('event.newtwo.starttime-label')}}</span>
            </label>
            <ClientOnly fallbackTag="span">
              <template #fallback>
                <p>...</p>
              </template>
              <v-date-picker v-model="state.startTime" mode="time" is24hr :minute-increment="10">
              </v-date-picker>
            </ClientOnly>
          </div>
          <div>
            <label class="label">
              <span class="label-text">{{$t('event.newtwo.endtime-label')}}</span>
            </label>
            <ClientOnly fallbackTag="span">
              <template #fallback>
                <p>...</p>
              </template>
              <v-date-picker v-model="state.endTime" mode="time" is24hr :minute-increment="10">
              </v-date-picker>
            </ClientOnly>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer">
              <input type="checkbox" class="toggle" v-model="showSecondCalendar" />
              <span class="label-text">{{$t('event.newtwo.span-mutliple-days')}}</span> 
            </label>
          </div>
        </div>
      </div>
      <div class="flex flex-row space-x-4 not-prose" v-if="showSecondCalendar">
        <div>
          <label class="label">
            <span class="label-text">{{$t('event.newtwo.enddate-label')}}</span>
          </label>
          <ClientOnly fallbackTag="span">
            <template #fallback>
              <p>...</p>
            </template>
            <v-date-picker v-model="state.endTime" :min-date="state.startTime" is-required>
            </v-date-picker>
          </ClientOnly>
        </div>
      </div>
    <label class="label">
      <span class="label-text">{{$t('event.newtwo.placename-label')}}</span>
    </label>
    <input v-model="state.placeName" :placeholder="$t('event.newtwo.placename-placeholder')" class="input input-bordered bg-white w-full" />
    <label class="label">
      <span v-if="vd$.placeName.$error && vd$.placeName.maxLength.$invalid" class="label-text-alt text-error">{{$t('validation.maxLength', {length: 200})}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('event.newtwo.placedescription-label')}}</span>
    </label>
    <textarea v-model="state.placeDescription" :placeholder="$t('event.newtwo.placedescription-placeholder')" class="textarea textarea-bordered bg-white w-full" />
    <label class="label">
      <span v-if="vd$.placeDescription.$error && vd$.placeDescription.maxLength.$invalid" class="label-text-alt text-error">{{$t('validation.maxLength', {length: 500})}}</span>
    </label>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.maxAttendeeCapacity-label')}}</span>
      </label>
      <input v-model="state.maxAttendeeCapacity" type="text" :placeholder="$t('event.newfive.maxAttendeeCapacity-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="vd$.maxAttendeeCapacity.$error && vd$.maxAttendeeCapacity.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="cursor-pointer label">
        <span class="label-text">{{$t('event.newfive.mandatoryRegistration-label')}}</span> 
        <input v-model="state.mandatoryRegistration" type="checkbox" class="toggle toggle-primary" />
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-start space-x-4">
        <input v-model="state.isOffline" type="checkbox" class="checkbox" />
        <span class="label-text">{{$t('event.newfour.is-offline')}}</span> 
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-start space-x-4">
        <input v-model="state.isOnline" type="checkbox" class="checkbox" />
        <span class="label-text">{{$t('event.newfour.is-online')}}</span> 
      </label>
    </div>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.accessibility-label')}}</span>
    </label>
    <textarea v-model="state.accessibility" class="textarea textarea-bordered bg-white w-full" :placeholder="$t('event.newfour.accessibility-placeholder')"/>
    <button class="btn btn-primary mt-4 grow" @click="addDate">{{$t('event.newtwo.add-date')}}</button>
    <label class="label">
      <span v-if="v$.dates.$error && v$.dates.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      <span v-if="v$.dates.$error && v$.dates.minLength.$invalid" class="label-text-alt text-error">{{$t('validation.minLength', {length: 1})}}</span>
    </label>
    <div class="flex flex-row w-full space-x-4 mt-10 mb-10">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="emit('prev')">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
