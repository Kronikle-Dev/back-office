<script lang="ts" setup>
import { Teams } from 'appwrite'
import { useVuelidate } from '@vuelidate/core'
import { required, maxLength } from '@vuelidate/validators'
import { usePlaces, PlaceError, PLACE_NAME_MAX, PLACE_DESCRIPTION_MAX } from '@/composables/usePlaces'

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const { $appwrite } = useNuxtApp()
const { t } = useI18n()

const myTeams = await new Teams($appwrite().client).list()
const organization = myTeams.teams[0]?.$id ?? ''

const { places, loading, list, create, update, remove, importFromDates } = usePlaces(organization)

// Renommer ou supprimer un lieu ne touche jamais aux séances : la page ne
// manipule que la collection `place`.

const saving = ref(false)
const importing = ref(false)

const rules = {
  name: { required, maxLength: maxLength(PLACE_NAME_MAX) },
  description: { maxLength: maxLength(PLACE_DESCRIPTION_MAX) },
}

const newPlace = reactive({ name: '', description: '' })
const vNew$ = useVuelidate(rules, newPlace)

const editing = ref<KPlace | null>(null)
const editForm = reactive({ name: '', description: '' })
const vEdit$ = useVuelidate(rules, editForm)

const deleting = ref<KPlace | null>(null)

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

const toast = reactive({ message: '', type: 'success' as 'success' | 'error' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast (key: string, type: 'success' | 'error', params: Record<string, unknown> = {}) {
  toast.message = t(key, params)
  toast.type = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.message = '' }, 5000)
}

function showError (e: unknown, fallbackKey: string) {
  // Une PlaceError est une erreur métier attendue (doublon, nom vide) : pas de bruit en console.
  if (!(e instanceof PlaceError)) console.error(e)
  showToast(e instanceof PlaceError ? e.key : fallbackKey, 'error')
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function load () {
  try {
    await list()
  } catch (e) {
    showError(e, 'place.errors.load')
  }
}

onMounted(load)

async function addPlace () {
  if (!(await vNew$.value.$validate())) return
  saving.value = true
  try {
    await create({ name: newPlace.name, description: newPlace.description })
    newPlace.name = ''
    newPlace.description = ''
    vNew$.value.$reset()
    showToast('place.created', 'success')
  } catch (e) {
    showError(e, 'place.errors.save')
  } finally {
    saving.value = false
  }
}

function openEdit (place: KPlace) {
  editForm.name = place.name
  editForm.description = place.description
  vEdit$.value.$reset()
  editing.value = place
}

function closeEdit () {
  editing.value = null
}

async function saveEdit () {
  if (!editing.value?.$id) return
  if (!(await vEdit$.value.$validate())) return
  saving.value = true
  try {
    await update(editing.value.$id, { name: editForm.name, description: editForm.description })
    editing.value = null
    showToast('place.updated', 'success')
  } catch (e) {
    showError(e, 'place.errors.save')
  } finally {
    saving.value = false
  }
}

async function confirmDelete () {
  if (!deleting.value?.$id) return
  saving.value = true
  try {
    await remove(deleting.value.$id)
    deleting.value = null
    showToast('place.deleted', 'success')
  } catch (e) {
    showError(e, 'place.errors.delete')
  } finally {
    saving.value = false
  }
}

async function runImport () {
  importing.value = true
  try {
    const result = await importFromDates()
    showToast('place.import-done', 'success', { created: result.created, dates: result.scannedDates })
  } catch (e) {
    showError(e, 'place.errors.import')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto prose pb-12">
    <h2>{{ $t('place.title') }}</h2>
    <p>{{ $t('place.subtitle') }}</p>

    <h3 class="mt-8">{{ $t('place.add-title') }}</h3>
    <div class="bg-white rounded p-4 not-prose">
      <label class="label">
        <span class="label-text">{{ $t('place.name-label') }}</span>
      </label>
      <input v-model="newPlace.name" type="text" :placeholder="$t('place.name-placeholder')" class="input input-bordered bg-white w-full" @keydown.enter.prevent="addPlace" />
      <label class="label">
        <span v-if="vNew$.name.$error && vNew$.name.required.$invalid" class="label-text-alt text-error">{{ $t('validation.required') }}</span>
        <span v-else-if="vNew$.name.$error && vNew$.name.maxLength.$invalid" class="label-text-alt text-error">{{ $t('validation.maxLength', { length: PLACE_NAME_MAX }) }}</span>
      </label>
      <label class="label">
        <span class="label-text">{{ $t('place.description-label') }}</span>
      </label>
      <textarea v-model="newPlace.description" :placeholder="$t('place.description-placeholder')" class="textarea textarea-bordered bg-white w-full" />
      <label class="label">
        <span v-if="vNew$.description.$error && vNew$.description.maxLength.$invalid" class="label-text-alt text-error">{{ $t('validation.maxLength', { length: PLACE_DESCRIPTION_MAX }) }}</span>
      </label>
      <button class="btn btn-primary mt-2" :disabled="saving" @click="addPlace">{{ $t('place.add') }}</button>
    </div>

    <h3 class="mt-8">{{ $t('place.list-title') }}</h3>
    <div class="flex flex-col sm:flex-row sm:items-center gap-4 not-prose">
      <button class="btn btn-outline btn-primary" :disabled="importing" @click="runImport">
        <span v-if="importing" class="loading loading-spinner loading-sm"></span>
        {{ $t('place.import') }}
      </button>
      <span class="text-sm opacity-70">{{ $t('place.import-hint') }}</span>
    </div>

    <div v-if="loading" class="mt-4"><span class="loading loading-spinner"></span></div>
    <p v-else-if="places.length === 0">{{ $t('place.empty') }}</p>
    <div v-else class="overflow-x-auto mt-4 not-prose">
      <table class="table table-zebra bg-white rounded">
        <thead>
          <tr>
            <th>{{ $t('place.column-name') }}</th>
            <th>{{ $t('place.column-description') }}</th>
            <th class="text-right">{{ $t('place.column-actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="place of places" :key="place.$id">
            <td class="font-medium">{{ place.name }}</td>
            <td class="whitespace-pre-line">{{ place.description }}</td>
            <td class="text-right whitespace-nowrap">
              <button class="btn btn-ghost btn-xs" @click="openEdit(place)">{{ $t('place.rename') }}</button>
              <button class="btn btn-ghost btn-xs text-error" @click="deleting = place">{{ $t('place.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog class="modal" :class="{ 'modal-open': editing }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ $t('place.edit-title') }}</h3>
        <label class="label">
          <span class="label-text">{{ $t('place.name-label') }}</span>
        </label>
        <input v-model="editForm.name" type="text" :placeholder="$t('place.name-placeholder')" class="input input-bordered bg-white w-full" @keydown.enter.prevent="saveEdit" />
        <label class="label">
          <span v-if="vEdit$.name.$error && vEdit$.name.required.$invalid" class="label-text-alt text-error">{{ $t('validation.required') }}</span>
          <span v-else-if="vEdit$.name.$error && vEdit$.name.maxLength.$invalid" class="label-text-alt text-error">{{ $t('validation.maxLength', { length: PLACE_NAME_MAX }) }}</span>
        </label>
        <label class="label">
          <span class="label-text">{{ $t('place.description-label') }}</span>
        </label>
        <textarea v-model="editForm.description" :placeholder="$t('place.description-placeholder')" class="textarea textarea-bordered bg-white w-full" />
        <label class="label">
          <span v-if="vEdit$.description.$error && vEdit$.description.maxLength.$invalid" class="label-text-alt text-error">{{ $t('validation.maxLength', { length: PLACE_DESCRIPTION_MAX }) }}</span>
        </label>
        <div class="modal-action">
          <button class="btn" :disabled="saving" @click="closeEdit">{{ $t('place.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveEdit">{{ $t('place.save') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeEdit">close</button>
      </form>
    </dialog>

    <dialog class="modal" :class="{ 'modal-open': deleting }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ $t('place.delete-title') }}</h3>
        <p class="py-4">{{ $t('place.delete-confirm', { name: deleting?.name ?? '' }) }}</p>
        <div class="modal-action">
          <button class="btn" :disabled="saving" @click="deleting = null">{{ $t('place.cancel') }}</button>
          <button class="btn btn-error" :disabled="saving" @click="confirmDelete">{{ $t('place.delete') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="deleting = null">close</button>
      </form>
    </dialog>

    <div v-if="toast.message" class="toast toast-end z-50">
      <div class="alert" :class="toast.type === 'error' ? 'alert-error' : 'alert-success'">
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>
