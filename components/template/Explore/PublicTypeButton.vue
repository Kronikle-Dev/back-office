<script setup lang="ts">
const props = defineProps({
  publicName: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  addIcon: Boolean
})

const emit = defineEmits(['select', 'deselect'])

const state = reactive({
  clicked: false
})

function toggleState () {
  if (state.clicked) {
    emit('deselect', props.publicId)
  } else {
    emit('select', props.publicId)
  }
  state.clicked = !state.clicked
}
</script>

<template>
  <div class="py-2 px-5 rounded-full flex flex-row space-x-2 cursor-pointer w-fit hover:bg-primary-100-kv3"
        :class="{'bg-urfist-500': state.clicked, 'bg-urfist-600': !state.clicked}"
        @click="toggleState">
    <span class="font-medium text-primary-100-kv3 text-lg">{{ props.publicName }}</span>
    <div class="inline-block self-center">
      <svg v-if="!state.clicked && props.addIcon" class="w-5 h-5 text-primary-100-kv3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM14 11H11V14C11 14.55 10.55 15 10 15C9.45 15 9 14.55 9 14V11H6C5.45 11 5 10.55 5 10C5 9.45 5.45 9 6 9H9V6C9 5.45 9.45 5 10 5C10.55 5 11 5.45 11 6V9H14C14.55 9 15 9.45 15 10C15 10.55 14.55 11 14 11Z" fill="currentColor"/>
      </svg>
      <svg  v-if="state.clicked && props.addIcon" class="w-5 h-5 text-primary-300-kv3" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM7.29 14.29L3.7 10.7C3.31 10.31 3.31 9.68 3.7 9.29C4.09 8.9 4.72 8.9 5.11 9.29L8 12.17L14.88 5.29C15.27 4.9 15.9 4.9 16.29 5.29C16.68 5.68 16.68 6.31 16.29 6.7L8.7 14.29C8.32 14.68 7.68 14.68 7.29 14.29Z" fill="currentColor"/>
      </svg>
    </div>
  </div>
</template>