<script lang="ts" setup>
import { Storage } from 'appwrite'

import vueFilePond from "vue-filepond"
import "filepond/dist/filepond.min.css"
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';

const { $appwrite } = useNuxtApp()

const FilePond = vueFilePond(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview,
  FilePondPluginFileValidateSize
)

const emit = defineEmits(['next', 'prev'])

const props = defineProps(['event'])
const imageResp = ref(null as any)


const serverObj = {
  // @ts-ignore
  process: async (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
    const storage = new Storage($appwrite().client)
    if (typeof(file) === 'string') {
      // Image has been loaded from URL
      load(file)
    } else if (file instanceof File) {
      try {
        const resp = await storage.createFile('event-thumbnails', 'unique()', file)
        const thumbnailId = resp.$id
        const thumbnailUrl = await storage.getFilePreview('event-thumbnails', thumbnailId)
        state.imageId = thumbnailId
        state.imageUrl = thumbnailUrl.href
        load(thumbnailUrl)
      } catch (e) {
        console.error(e)
        error(e)
      }
    } else {
      load(file)
    }
  },
  fetch: null,
}

const state = reactive({
  imageId: props.event.imageId,
  imageUrl: props.event.imageUrl
})

const imageToLoad = ref([] as Array<string>)

onMounted(() => {
  if (state.imageUrl && state.imageUrl.length > 0) {
    imageToLoad.value = [state.imageUrl]
  }
})

async function next () {
  emit('next', {
    imageId: state.imageId,
    imageUrl: state.imageUrl
  })
}
</script>

<template>
  <div>
    <h2>{{$t('event.newthree.title')}}</h2>
    <p>{{$t('event.newthree.subtitle')}}</p>
    <ClientOnly>
      <FilePond
        ref="pond"
        class="mt-9 cursor-pointer"
        credits="false"
        allowMultiple="false"
        accepted-file-types="image/jpeg, image/png"
        max-file-size="5MB"
        :label-idle="$t('event.newthree.image-placeholder')"
        :server="serverObj"
        :files="imageToLoad"
        v-model="state.imageUrl"
      />
    </ClientOnly>
    <div class="flex flex-row w-full space-x-4">
      <button class="btn btn-outline btn-primary mt-4 grow" @click="emit('prev')">{{$t('form.previous')}}</button>
      <button class="btn btn-primary mt-4 grow" @click="next">{{$t('form.next')}}</button>
    </div>
  </div>
</template>

<style scoped></style>
