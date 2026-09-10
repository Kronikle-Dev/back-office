<script lang="ts" setup>
import { Databases, Query } from 'appwrite'

const {$appwrite} = useNuxtApp()

const databases = new Databases($appwrite().client)

const props = defineProps<{
  event: KEvent,
  editButton: boolean
}>()

const showArchiveModal = ref(false)

if (!props.event.$id) {
  throw new Error('Missing event id');
}

const htmlDescription = renderMarkdown(props.event.description)

const dates = (await $appwrite().getAllPages('kronikle', 'date', [
  Query.equal('eventId', props.event.$id)
])) as unknown as KDate[]

const orderedDates = computed(() => {
  return dates.sort((a: any, b: any) => {
    return a.startDateTime - b.startDateTime
  })
})

const deleteEvent = async () => {
  //await databases.deleteDocument('kronikle', 'event', props.event.$id as string)
  await databases.updateDocument('kronikle', 'event', props.event.$id as string, {
    status: 'archived'
  })
  navigateTo('/')
}

const restoreEvent = async () => {
  await databases.updateDocument('kronikle', 'event', props.event.$id as string, {
    status: 'published'
    })
   navigateTo('/')
}


function closePrintModale () {
  //@ts-ignore
  document.querySelector('#printModale').close()
}
</script>

<template>
  <div class="max-w-xl ml-4">
    <div class="card bg-white not-prose shadow">
      <!-- `z-10` : les boutons doivent rester au-dessus du visuel (EventVisual est positionné) -->
      <NuxtLink :to="`/event/edit/${props.event.$id}`" class="absolute top-4 left-4 z-10">
        <div class="btn btn-primary">{{$t('event.card.edit')}}</div>
      </NuxtLink>
      <div v-show="props.event.status !== 'archived'" class="absolute top-4 right-4 z-10 btn btn-primary btn-outline bg-white" @click="showArchiveModal = true">{{ $t('event.card.delete') }}</div>
      <div v-show="props.event.status === 'archived'" class="absolute top-4 right-4 z-10 btn btn-primary btn-outline bg-white" @click="restoreEvent">{{ $t('event.card.restore') }}</div>
      <button onclick="printModale.showModal()" class="absolute top-20 left-4 z-10 btn btn-primary">{{ $t('event.card.print') }}</button>
      <figure><EventVisual :event="props.event" class="rounded-t-2xl w-full max-h-[360px] object-cover" /></figure>
      <div class="card-body">
        <h2 class="card-title">{{props.event.name}}</h2>
        <div v-html="htmlDescription"></div>
        <!--
        <div>
          <span v-for="tag of props.event.tags" :key="tag">{{availableTags.find((t) => t.$id === tag)?.name}} </span>
        </div>-->
        <div class="grid sm:grid-cols-2 grid-cols-1 gap-4 mt-4">
          <SessionCard v-for="date of orderedDates" :key="`${date.$id}`" :date="date" />
        </div>
      </div>
    </div>
    <dialog id="printModale" class="modal">
      <PrintForm :event="event" @close="closePrintModale"></PrintForm>
    </dialog>
    <dialog class="modal" id="archiveEvent" :class="{ 'modal-open': showArchiveModal }" >
      <div class="modal-box">
        <h3 class="font-bold text-lg">Archiver l'événement</h3>
        <p class="py-4">Voulez-vous vraiment archiver cet événement ?</p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn" @click="showArchiveModal = false"> Annuler</button>
          </form>
          <button class="btn btn-error" @click="deleteEvent">Archiver</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showArchiveModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>