<script setup lang="ts">
import { Avatars, Query } from 'appwrite'
import { jsPDF } from "jspdf"
const {$appwrite} = useNuxtApp()

const avatars = new Avatars($appwrite().client)

const props = defineProps<{
  event: KEvent,
}>()

const selectedDate = ref<string | null>(null)
const selectedFormat = ref<string | null>('bookmark')
const selectedDisplay = ref<string | null>(null)

if (!props.event.$id) {
  throw new Error('Missing event id');
}

const dates = (await $appwrite().getAllPages('kronikle', 'date', [
  Query.equal('eventId', props.event.$id)
])) as unknown as KDate[]

const displays = (await $appwrite().getAllPages('kronikle', 'display')) as unknown as KDisplay[]

const orderedDates = computed(() => {
  return dates.sort((a: any, b: any) => {
    return a.startDateTime - b.startDateTime
  })
})

async function downloadPDF () {
    if (selectedDate.value === null || selectedDisplay.value === null || selectedFormat.value === null) {
        return
    }
    const qrUrl = avatars.getQR(`https://app.kronikle.eu/dq/${selectedDisplay.value}/date/${selectedDate.value}`).toString()
    const startDate = new Date(dates.find((d) => d.$id === selectedDate.value)?.startDateTime as unknown as string)
    const dateString = `${startDate.toLocaleDateString('fr', {month: 'long', year: 'numeric', day: '2-digit'})} - ${startDate.toLocaleTimeString('fr', {hour: '2-digit'})}${startDate.toLocaleTimeString('fr', {minute: '2-digit'})}`
    const truncatedDescription = props.event.description.length > 130 ? props.event.description.substring(0, 130) + '...' : props.event.description
    const truncatedName = props.event.name.length > 64 ? props.event.name.substring(0, 64) + '...' : props.event.name
    var doc = new jsPDF("landscape")

    for (let i = 0 ; i < 6 ; i++) {
        doc.setDrawColor(240, 240, 240)
        doc.rect(15+45*i, 15, 45, 180)
        doc.setFillColor(180, 40, 40)
        doc.rect(14+45*i, 20, 46, 1, "F")
        doc.rect(14+45*i, 22, 46, 1, "F")
        doc.setFontSize(18)
        doc.setFont("helvetica", "bold")
        doc.text(truncatedName, 47+45*i, 28, {angle: 270, maxWidth:123})
        doc.setFontSize(9)
        doc.setFont("helvetica", "italic")
        doc.text(truncatedDescription, 33+45*i, 28, {angle: 270, maxWidth:123})
        doc.setFontSize(18)
        doc.setFont("helvetica", "bold")
        doc.text(dateString, 20+45*i, 28, {angle: 270, maxWidth:123})
        doc.addImage(qrUrl, "PNG", 20+45*i, 152, 35, 35)

    }

    doc.save(`bookmark-${props.event.$id}.pdf`);
    console.log('Download PDF')
}

</script>

<template>
    <div class="modal-box">
        <h3 class="font-bold text-lg">{{  $t('event.card.print') }}</h3>
        <p class="py-4">{{  $t('event.card.print-com-support') }}</p>
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Quelle date ?</span>
            </div>
            <select v-model="selectedDate" class="select select-bordered w-full max-w-xs">
                <option disabled selected>{{  $t('event.card.select-date') }}</option>
                <option v-for="date of orderedDates" :value="date.$id">{{ (new Date(date.startDateTime)).toLocaleDateString() }}</option>
            </select>
        </label>
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Quelle format d'impression ?</span>
            </div>
            <select v-model="selectedFormat" class="select select-bordered w-full max-w-xs">
                <option selected value="bookmark">Marque page</option>
            </select>
        </label>
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">À quel affichage relier l'impression ?</span>
            </div>
            <select v-model="selectedDisplay" class="select select-bordered w-full max-w-xs">
                <option disabled selected value="bookmark">{{  $t('event.card.select-display') }}</option>
                <option v-for="display of displays" :value="display.$id">{{ display.name }}</option>
            </select>
        </label>
        <div class="modal-action">
            <a class="btn btn-primary" @click="downloadPDF">Générer le PDF</a>
            <form method="dialog ">
                <!-- if there is a button in form, it will close the modal -->
                <button class="btn">Close</button>
            </form>
        </div>
    </div>
</template>