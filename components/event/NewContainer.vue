<script lang="ts" setup>
import { Databases } from 'appwrite'
import {ref} from 'vue'
const router = useRouter()
const props = defineProps(['event', 'dates'])
const emit = defineEmits(['fragment', 'datefragment', 'publish'])
const {$appwrite} = useNuxtApp()

const step = ref(0)

function processNext(fragment:any) {
  emit('fragment', fragment)
  step.value++
}

function processNextDates (fragment:Array<any>) {
  emit('datefragment', fragment)
  step.value++
}


const availableTags = ref([] as Array<{$id: string, name: string}>)
const availablePublicTypes = ref([] as Array<{$id: string, name: string}>)
const availableEventTypes = ref([] as Array<{$id: string, name: string}>)

onMounted(() => {
  const databases = new Databases($appwrite().client)
  $appwrite().getAllPages('kronikle', 'tag').then((response: any[]) => {
    availableTags.value = response.map((doc: { $id: any; name: any }): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  })
  $appwrite().getAllPages('kronikle', 'public-type').then((response: any[]) => {
    availablePublicTypes.value = response.map((doc: { $id: any; name: any }): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  })
  $appwrite().getAllPages('kronikle', 'event-type').then((response: any[]) => {
    availableEventTypes.value = response.map((doc: { $id: any; name: any }): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  })
})

</script>

<template>
  <div>
    <ul class="steps pl-0">
      <li class="step step-primary">{{$t('event.new.step-one')}}</li>
      <li class="step" :class="{'step-primary': step>= 1}">{{$t('event.new.step-two')}}</li>
      <li class="step" :class="{'step-primary': step>= 2}">{{$t('event.new.step-three')}}</li>
      <li class="step" :class="{'step-primary': step>= 3}">{{$t('event.new.step-four')}}</li>
      <li class="step" :class="{'step-primary': step>= 4}">{{$t('event.new.step-five')}}</li>
    </ul>
    <h1 class="h1">{{props.event.name.length > 0 ? props.event.name : $t('event.new.title')}}</h1>
    <EventNew1
      v-if="step == 0"
      :event="props.event"
      @next="processNext"
      @prev="router.back()">
    </EventNew1>
    <EventNew2
      v-if="step == 1"
      :event="props.event"
      :dates="props.dates"
      @next="processNextDates"
      @prev="step = 0">
    </EventNew2>
    <EventNew3
      v-if="step == 2"
      :event="props.event"
      @next="processNext"
      @prev="step = 1">
    </EventNew3>
    <EventNew4
      v-if="step == 3"
      :event="props.event"
      :availableTags="availableTags"
      :availablePublicTypes="availablePublicTypes"
      :availableEventTypes="availableEventTypes"
      @next="processNext"
      @prev="step = 2">
    </EventNew4>
    <EventNew5
      v-if="step == 4"
      :event="props.event"
      @next="processNext"
      @prev="step = 3">
    </EventNew5>
    <EventNew6
      v-if="step == 5"
      :event="props.event"
      :dates="props.dates"
      :availableTags="availableTags"
      :availablePublicTypes="availablePublicTypes"
      :availableEventTypes="availableEventTypes"
      @next="emit('publish')"
      @prev="step = 4">
    </EventNew6>
  </div>
</template>

<style scoped></style>
