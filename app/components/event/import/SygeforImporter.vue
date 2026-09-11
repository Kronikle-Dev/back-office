<script lang="ts" setup>
const props = defineProps<{
  organization: string,
  existingOriginIds: string[],
}>()

const query = ref('')
const importing = ref(false)
const errorMessage = ref('')

const { importKEvent } = useEventImporter(props.organization)

const { data: events, pending, refresh } = await useFetch(() => `/api/third-party/${props.organization}/list?query=${query.value}`)

function search () {
  refresh()
}

async function importEvent (eventId: string) {
  importing.value = true
  errorMessage.value = ''
  try {
    // @ts-expect-error - $fetch return type doesn't narrow based on generic param in older Nuxt
    const imported = (await $fetch(`/api/third-party/${props.organization}/event/${eventId}`)) as KImportEvent
    const createdId = await importKEvent(imported)
    importing.value = false
    navigateTo('/event/' + createdId)
  } catch (e: any) {
    console.log(e)
    importing.value = false
    errorMessage.value = e?.message || 'error'
  }
}
</script>

<template>
  <div>
    <label class="label">
      <span class="label-text">{{ $t('event.import.name-label') }}</span>
    </label>
    <input
      v-model="query"
      type="text"
      :placeholder="$t('event.import.name-placeholder')"
      class="input input-bordered bg-white w-full"
      @keypress.enter="search">
    <div v-if="pending" class="my-4">{{ $t('event.import.loading') }}</div>
    <div
      v-for="event of events"
      :key="event.id"
      class="my-3 bg-white card shadow py-2 px-4 cursor-pointer hover:shadow-lg flex flex-row justify-between items-center"
      :class="{ 'bg-base-100': pending, 'text-base-200': pending }"
      @click="props.existingOriginIds.includes(event.id) ? null : importEvent(event.id)">
      <div>
        <div class="font-bold">{{ event.name }}</div>
        <div v-for="date of event.date" :key="date" class="text-sm">{{ (new Date(date)).toLocaleDateString() }}</div>
      </div>
      <div v-if="props.existingOriginIds.includes(event.id)" class="shrink-0">{{ $t('event.import.already-imported') }}</div>
    </div>

    <input id="sygefor-importing" v-model="importing" type="checkbox" class="modal-toggle">
    <div class="modal">
      <div class="modal-box">
        <p class="py-4">{{ $t('event.import.importing') }}</p>
      </div>
    </div>

    <div v-if="errorMessage" class="toast toast-end z-50">
      <div class="alert alert-error"><span>{{ $t('event.import.failed') }}</span></div>
    </div>
  </div>
</template>
