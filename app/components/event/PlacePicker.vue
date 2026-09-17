<script lang="ts" setup>
import { normalizePlaceName } from '@/composables/usePlaces'

// Champ « nom du lieu » en saisie libre, avec une liste de suggestions parmi
// les lieux connus de l'organisation. Choisir un lieu remplit aussi la
// description ; taper un nom inédit reste possible.

const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })

const props = defineProps<{
  places: KPlace[],
  placeholder?: string,
}>()

const open = ref(false)
const highlighted = ref(-1)

// Des doublons de casse peuvent exister en base (lieux créés avant le référentiel).
const uniquePlaces = computed(() => {
  const seen = new Set<string>()
  const result: KPlace[] = []
  for (const place of props.places) {
    const key = normalizePlaceName(place.name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(place)
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
})

const suggestions = computed(() => {
  const query = normalizePlaceName(name.value ?? '')
  if (!query) return uniquePlaces.value
  return uniquePlaces.value.filter((p) => normalizePlaceName(p.name).includes(query))
})

watch(name, () => { highlighted.value = -1 })

function select (place: KPlace) {
  name.value = place.name
  description.value = place.description
  open.value = false
  highlighted.value = -1
}

function move (delta: number) {
  if (suggestions.value.length === 0) return
  open.value = true
  const last = suggestions.value.length - 1
  highlighted.value = Math.min(Math.max(highlighted.value + delta, 0), last)
}

function onEnter (event: KeyboardEvent) {
  if (!open.value || highlighted.value < 0) return
  const place = suggestions.value[highlighted.value]
  if (!place) return
  event.preventDefault()
  select(place)
}
</script>

<template>
  <div class="relative not-prose">
    <input
      v-model="name"
      type="text"
      autocomplete="off"
      role="combobox"
      :aria-expanded="open"
      :placeholder="placeholder"
      class="input input-bordered bg-white w-full"
      @focus="open = true"
      @input="open = true"
      @blur="open = false"
      @keydown.esc.prevent="open = false"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter="onEnter"
    />
    <ul
      v-if="open && suggestions.length"
      role="listbox"
      class="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto menu menu-sm bg-base-100 rounded-box shadow-lg border border-base-300 p-2 flex-nowrap"
    >
      <li v-for="(place, i) of suggestions" :key="place.$id" role="option" :aria-selected="i === highlighted">
        <!-- mousedown.prevent : le blur de l'input (qui ferme la liste) ne doit pas précéder le clic. -->
        <a :class="{ active: i === highlighted }" @mousedown.prevent="select(place)" @mousemove="highlighted = i">
          <div class="flex flex-col items-start min-w-0">
            <span class="font-medium">{{ place.name }}</span>
            <span v-if="place.description" class="text-xs opacity-70 truncate max-w-full">{{ place.description }}</span>
          </div>
        </a>
      </li>
    </ul>
  </div>
</template>
