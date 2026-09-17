<script lang="ts" setup>
import {useVuelidate} from '@vuelidate/core'
import { required, minLength, maxLength, integer } from '@vuelidate/validators'
import 'v-calendar/dist/style.css';
import { storeToRefs } from 'pinia'
import { useEventDraftStore } from '@/stores/eventDraft'

const store = useEventDraftStore()
const { dates } = storeToRefs(store)

const showSecondCalendar = ref(false)

const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric' }

const HOUR = 3600000

function roundedNow () {
  return new Date(new Date().setMinutes(0, 0, 0))
}

// Seul état local de l'étape : la séance en cours de saisie, avant son ajout à
// `store.dates`. Les séances elles-mêmes vivent dans le store.
const blankForm = () => ({
  placeName: '',
  placeDescription: '',
  startTime: roundedNow(),
  endTime: new Date(roundedNow().getTime() + HOUR),
  maxAttendeeCapacity: null as number | string | null,
  mandatoryRegistration: false,
  accessibility: '',
  isOffline: true,
  isOnline: false,
})

const form = reactive(blankForm())

watch(() => form.startTime, (newVal) => {
  if (newVal > form.endTime) {
    form.endTime = new Date(new Date(newVal).getTime() + HOUR)
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
const vd$ = useVuelidate(rulesDate, form)
const v$ = useVuelidate(rulesEvent, { dates })

async function next () {
  if (!(await v$.value.$validate())) return
  store.nextStep()
}

function attendanceMode () {
  if (form.isOffline && form.isOnline) return 'mixed'
  if (form.isOnline) return 'online'
  return 'offline'
}

async function addDate() {
  if (!(await vd$.value.$validate())) return
  store.addDate({
    startDateTime: form.startTime,
    endDateTime: form.endTime,
    placeName: form.placeName.trim(),
    placeDescription: form.placeDescription.trim(),
    maxAttendeeCapacity: form.maxAttendeeCapacity ? parseInt(String(form.maxAttendeeCapacity), 10) : null,
    mandatoryRegistration: form.mandatoryRegistration,
    accessibility: form.accessibility,
    attendanceMode: attendanceMode(),
  })
  Object.assign(form, blankForm())
  vd$.value.$reset()
}

function cloneDate(date: KDate) {
  form.startTime = new Date(date.startDateTime)
  form.endTime = new Date(date.endDateTime)
  form.placeName = date.placeName
  form.placeDescription = date.placeDescription
  form.maxAttendeeCapacity = date.maxAttendeeCapacity as number | null
  form.mandatoryRegistration = date.mandatoryRegistration
  form.accessibility = date.accessibility
  form.isOffline = date.attendanceMode == 'mixed' || date.attendanceMode == 'offline'
  form.isOnline = date.attendanceMode == 'mixed' || date.attendanceMode == 'online'
}

</script>

<template>
  <div>
    <h2>{{$t('event.newtwo.title')}}</h2>
    <p>{{$t('event.newtwo.subtitle')}}</p>
      <div class="flex flex-row space-x-4 not-prose">
        <div>
          <label class="label">
            <span class="label-text">{{$t('event.newtwo.startdate-label')}}</span>
          </label>
          <ClientOnly fallbackTag="span">
            <template #fallback>
              <p>...</p>
            </template>
            <v-date-picker v-model="form.startTime" is-required>
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
              <v-date-picker v-model="form.startTime" mode="time" is24hr :minute-increment="10">
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
              <v-date-picker v-model="form.endTime" mode="time" is24hr :minute-increment="10">
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
            <v-date-picker v-model="form.endTime" :min-date="form.startTime" is-required>
            </v-date-picker>
          </ClientOnly>
        </div>
      </div>
    <label class="label">
      <span class="label-text">{{$t('event.newtwo.placename-label')}}</span>
    </label>
    <EventPlacePicker v-model:name="form.placeName" v-model:description="form.placeDescription" :places="store.availablePlaces" :placeholder="$t('event.newtwo.placename-placeholder')" />
    <label class="label">
      <span class="label-text-alt">{{$t('event.newtwo.placename-hint')}} <NuxtLink to="/place" class="link">{{$t('event.newtwo.manage-places')}}</NuxtLink></span>
    </label>
    <label class="label">
      <span v-if="vd$.placeName.$error && vd$.placeName.maxLength.$invalid" class="label-text-alt text-error">{{$t('validation.maxLength', {length: 200})}}</span>
    </label>
    <label class="label">
      <span class="label-text">{{$t('event.newtwo.placedescription-label')}}</span>
    </label>
    <textarea v-model="form.placeDescription" :placeholder="$t('event.newtwo.placedescription-placeholder')" class="textarea textarea-bordered bg-white w-full" />
    <label class="label">
      <span v-if="vd$.placeDescription.$error && vd$.placeDescription.maxLength.$invalid" class="label-text-alt text-error">{{$t('validation.maxLength', {length: 500})}}</span>
    </label>
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{$t('event.newfive.maxAttendeeCapacity-label')}}</span>
      </label>
      <input v-model="form.maxAttendeeCapacity" type="text" :placeholder="$t('event.newfive.maxAttendeeCapacity-placeholder')" class="input input-bordered bg-white w-full" />
      <label class="label">
        <span v-if="vd$.maxAttendeeCapacity.$error && vd$.maxAttendeeCapacity.integer.$invalid" class="label-text-alt text-error">{{$t('validation.integer')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="cursor-pointer label">
        <span class="label-text">{{$t('event.newfive.mandatoryRegistration-label')}}</span>
        <input v-model="form.mandatoryRegistration" type="checkbox" class="toggle toggle-primary" />
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-start space-x-4">
        <input v-model="form.isOffline" type="checkbox" class="checkbox" />
        <span class="label-text">{{$t('event.newfour.is-offline')}}</span>
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-start space-x-4">
        <input v-model="form.isOnline" type="checkbox" class="checkbox" />
        <span class="label-text">{{$t('event.newfour.is-online')}}</span>
      </label>
    </div>
    <label class="label">
      <span class="label-text">{{$t('event.newfour.accessibility-label')}}</span>
    </label>
    <textarea v-model="form.accessibility" class="textarea textarea-bordered bg-white w-full" :placeholder="$t('event.newfour.accessibility-placeholder')"/>
    <button class="btn btn-primary mt-4 grow" @click="addDate">{{$t('event.newtwo.add-date')}}</button>
    <label class="label">
      <span v-if="v$.dates.$error && v$.dates.required.$invalid" class="label-text-alt text-error">{{$t('validation.required')}}</span>
      <span v-if="v$.dates.$error && v$.dates.minLength.$invalid" class="label-text-alt text-error">{{$t('validation.minLength', {length: 1})}}</span>
    </label>
    <div class="grid sm:grid-cols-2 gap-y-8 grid-cols-1 mb-10">
      <div v-for="date of store.orderedDates" :key="`${date.$id}`" class="indicator">
        <span v-if="date.new" class="indicator-item badge badge-primary cursor-pointer" @click="store.removeNewDate(date.$id)">{{$t('event.newtwo.delete')}}</span>
        <span v-else-if="date.status != 'canceled'" class="indicator-item badge badge-primary cursor-pointer" @click="store.cancelDate(date.$id)">{{$t('event.newtwo.cancel')}}</span>
        <span v-if="date.status == 'canceled'" class="indicator-item badge badge-primary cursor-pointer" @click="store.reinstateDate(date.$id)">{{$t('event.newtwo.reinstate')}}</span>
        <span v-if="date.status == 'canceled'" class="indicator-item indicator-start indicator-bottom badge badge-primary cursor-pointer" @click="store.deleteDate(date.$id)">{{$t('event.newtwo.definitive-delete')}}</span>
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
    <div class="flex flex-row w-full space-x-4 mt-10 mb-10">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="store.prevStep()">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
