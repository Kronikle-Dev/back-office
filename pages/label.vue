<script lang="ts" setup>
import { Databases, Teams, Query, Permission, Role } from 'appwrite'
const {$appwrite} = useNuxtApp()

definePageMeta({
  middleware: ["auth"],
  layout: "app",
})


const databases = new Databases($appwrite().client)
let organization = ''
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
if (myTeams.teams.length === 0) {
  organization = ''
}
const myTeamId = myTeams.teams[0].$id
organization = myTeamId

const availableTags = ref([] as Array<{$id: string, name: string}>)
const availablePublicTypes = ref([] as Array<{$id: string, name: string}>)
const availableEventTypes = ref([] as Array<{$id: string, name: string}>)

const state = reactive({
  newEventType: '',
  newTag: '',
  newPublicType: '',
  displayTagPopup: false,
  displayTypePopup: false,
  displayPublicPopup: false
})

onMounted(() => {
  const databases = new Databases($appwrite().client)
  let promiseArray = []
  promiseArray.push($appwrite().getAllPages('kronikle', 'tag', [
    Query.equal('author', organization)
  ]).then((response) => {
    availableTags.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'public-type', [
    Query.equal('author', organization)
  ]).then((response) => {
    availablePublicTypes.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
  promiseArray.push($appwrite().getAllPages('kronikle', 'event-type', [
    Query.equal('author', organization)
  ]).then((response) => {
    availableEventTypes.value = response.map((doc): {$id: string, name: string} => {
      return {
        $id: doc.$id,
        name: doc.name
      }
    })
  }))
})

async function addTag () {
  const obj = await databases.createDocument('kronikle', 'tag', 'unique()', {
    name: state.newTag,
    author: organization
  }, [
    Permission.delete(Role.team(organization)),
    Permission.update(Role.team(organization)),
    Permission.read(Role.any()),
  ])
  availableTags.value.push({
    $id: obj.$id,
    name: state.newTag
  })
  state.displayTagPopup = false
  state.newTag = ''
}

async function addPublic () {
  const obj = await databases.createDocument('kronikle', 'public-type', 'unique()', {
    name: state.newPublicType,
    author: organization
  }, [
    Permission.delete(Role.team(organization)),
    Permission.update(Role.team(organization)),
    Permission.read(Role.any()),
  ])
  availablePublicTypes.value.push({
    $id: obj.$id,
    name: state.newPublicType
  })
  state.displayPublicPopup = false
  state.newPublicType = ''
}

async function addType () {
  const obj = await databases.createDocument('kronikle', 'event-type', 'unique()', {
    name: state.newEventType,
    author: organization
  }, [
    Permission.delete(Role.team(organization)),
    Permission.update(Role.team(organization)),
    Permission.read(Role.any()),
  ])
  availableEventTypes.value.push({
    $id: obj.$id,
    name: state.newEventType
  })

  state.displayTypePopup = false
  state.newEventType = ''
}
</script>


<template>
  <div class="max-w-xl mx-auto prose pb-12">
    <h2>{{$t('label.title')}}</h2>
    <p>{{$t('label.subtitle')}}</p>
    <h3 class="mt-8">{{ $t('label.tag-title') }}</h3>
    <div class="h-40 overflow-y-scroll bg-white rounded p-4">
      <div v-for="tag of availableTags" :key="tag.$id" class="hover:bg-slate-200">{{ tag.name }}</div>
    </div>
    <label class="label mt-4">
      <span class="label-text">{{$t('label.tag-label')}}</span>
    </label>
    <div class="flex flex-row space-x-4">
      <input v-model="state.newTag" type="text" :placeholder="$t('label.tag-placeholder')" class="input input-bordered bg-white w-full" />
      <button class="btn btn-primary btn-square" @click="state.displayTagPopup = true">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
        </svg>
      </button>
    </div>
    <h3 class="mt-8">{{ $t('label.public-title') }}</h3>
    <div class="h-40 overflow-y-scroll bg-white rounded p-4">
      <div v-for="publict of availablePublicTypes" :key="publict.$id" class="hover:bg-slate-200">{{ publict.name }}</div>
    </div>
    <label class="label mt-4">
      <span class="label-text">{{$t('label.public-label')}}</span>
    </label>
    <div class="flex flex-row space-x-4">
      <input v-model="state.newPublicType" type="text" :placeholder="$t('label.public-placeholder')" class="input input-bordered bg-white w-full" />
      <button class="btn btn-primary btn-square" @click="state.displayPublicPopup = true">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
        </svg>
      </button>
    </div>
    <h3 class="mt-8">{{ $t('label.type-title') }}</h3>
    <div class="h-40 overflow-y-scroll bg-white rounded p-4">
      <div v-for="eventType of availableEventTypes" :key="eventType.$id" class="hover:bg-slate-200">{{ eventType.name }}</div>
    </div>
    <label class="label mt-4">
      <span class="label-text">{{$t('label.type-label')}}</span>
    </label>
    <div class="flex flex-row space-x-4">
      <input v-model="state.newEventType" type="text" :placeholder="$t('label.type-placeholder')" class="input input-bordered bg-white w-full" />
      <button class="btn btn-primary btn-square" @click="state.displayTypePopup = true">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
        </svg>
      </button>
    </div>
    <input type="checkbox" id="tag-modale" class="modal-toggle" v-model="state.displayTagPopup" />
    <div class="modal">
      <div class="modal-box">
        <p class="py-4">{{ $t('label.confirm-tag') }}</p>
        <div class="font-bold text-lg">{{ state.newTag }}</div>
        <div class="modal-action">
          <label class="btn btn-primary" @click="addTag">{{ $t('label.confirm') }} "{{ state.newTag }}"</label>
        </div>
      </div>
    </div>
    <input type="checkbox" id="public-modale" class="modal-toggle" v-model="state.displayPublicPopup" />
    <div class="modal">
      <div class="modal-box">
        <p class="py-4">{{ $t('label.confirm-public') }}</p>
        <div class="font-bold text-lg">{{ state.newPublicType }}</div>
        <div class="modal-action">
          <label class="btn btn-primary" @click="addPublic">{{ $t('label.confirm') }} "{{ state.newPublicType }}"</label>
        </div>
      </div>
    </div>
    <input type="checkbox" id="type-modale" class="modal-toggle" v-model="state.displayTypePopup" />
    <div class="modal">
      <div class="modal-box">
        <p class="py-4">{{ $t('label.confirm-type') }}</p>
        <div class="font-bold text-lg">{{ state.newEventType }}</div>
        <div class="modal-action">
          <label class="btn btn-primary" @click="addType">{{ $t('label.confirm') }} "{{ state.newEventType }}"</label>
        </div>
      </div>
    </div>
  </div>
</template>
