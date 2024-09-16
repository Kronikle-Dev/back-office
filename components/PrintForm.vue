<script setup lang="ts">
import { Avatars, Query, Storage } from 'appwrite'
import { jsPDF } from "jspdf"
const {$appwrite} = useNuxtApp()
//@ts-ignore
import showdown from 'showdown'

const converter = new showdown.Converter()

const avatars = new Avatars($appwrite().client)

const props = defineProps<{
  event: KEvent,
}>()

const selectedDate = ref<string | null>(null)
const selectedFormat = ref<string | null>(null)
const selectedDisplay = ref<string | null>(null)

const canGenerate = computed(() => {
    return selectedDate.value !== null && selectedDisplay.value !== null && selectedFormat.value !== null
})

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

// Inspired by https://stackoverflow.com/a/74977142
function removeMarkdown(markdown: string): string {
    // Replace bold text with plain text
    markdown = markdown.replace(/\*\*(.+?)\*\*/g, (match, p1) => p1 ?? "");
    markdown = markdown.replace(/__(.+?)__/g, (match, p1) => p1 ?? "");

    // Replace italicized text with plain text
    markdown = markdown.replace(/_(.+?)_/g, (match, p1) => p1 ?? '');
    markdown = markdown.replace(/\*(.+?)\*/g, (match, p1) => p1 ?? '');

    // Replace strikethrough text with plain text
    markdown = markdown.replace(/~~(.+?)~~/g, (match, p1) => p1 ?? '');

    // Replace inline code blocks with plain text
    markdown = markdown.replace(/`(.+?)`/g, (match, p1) => p1 ?? '');

    // Replace code blocks with plain text
    markdown = markdown.replace(/```[\s\S]*?```/g, (match, p1) => p1 ?? '');
    markdown = markdown.replace(/```[\s\S]*?```/g, (match, p1) => p1 ?? '');

    // Remove links
    markdown = markdown.replace(/\[(.+?)\]\((.+?)\)/g, (match, p1) => p1 ?? '');

    // Remove images
    markdown = markdown.replace(/!\[(.+?)\]\((.+?)\)/g, (match, p1) => p1 ?? '');

    // Remove headings
    markdown = markdown.replace(/^#+\s+(.+?)\s*$/gm, (match, p1) => p1 ?? '');
    markdown = markdown.replace(/^\s*=+\s*$/gm, (match, p1) => p1 ??'');
    markdown = markdown.replace(/^\s*-+\s*$/gm, (match, p1) => p1 ?? '');

    // Remove blockquotes
    markdown = markdown.replace(/^\s*>\s+(.+?)\s*$/gm, (match, p1) => p1 ?? '');

    // Remove lists
    //markdown = markdown.replace(/^\s*[\*\+-]\s+(.+?)\s*$/gm, (match, p1) => p1 ?? '');
    //markdown = markdown.replace(/^\s*\d+\.\s+(.+?)\s*$/gm, (match, p1) => p1 ?? '');


    return markdown;
}

function getImageSize(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = (error) => {
            reject(error);
        };
        img.src = url;
    });
}

async function downloadPDF () {
    if (selectedDate.value === null || selectedDisplay.value === null || selectedFormat.value === null) {
        return
    }

    if (selectedFormat.value === 'bookmark') {
        const qrUrl = avatars.getQR(`https://app.kronikle.eu/dq/${selectedDisplay.value}/date/${selectedDate.value}`).toString()
        const startDate = new Date(dates.find((d) => d.$id === selectedDate.value)?.startDateTime as unknown as string)
        const dateString = `${startDate.toLocaleDateString('fr', {month: 'long', year: 'numeric', day: '2-digit'})} - ${startDate.toLocaleTimeString('fr', {hour: '2-digit'})}${startDate.toLocaleTimeString('fr', {minute: '2-digit'})}`
        const truncatedDescription = props.event.description.length > 130 ? props.event.description.replace(/(\r\n|\n|\r)/gm, " ").substring(0, 130) + '...' : props.event.description.replace(/(\r\n|\n|\r)/gm, "")
        const truncatedName = props.event.name.length > 64 ? props.event.name.replace(/(\r\n|\n|\r)/gm, " ").substring(0, 64) + '...' : props.event.name.replace(/(\r\n|\n|\r)/gm, "")
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
    } else if (selectedFormat.value === 'flyer') {
        const storage = new Storage($appwrite().client)
        const coverUrl = await storage.getFilePreview('event-thumbnails', props.event.imageId as string, 200, 200, 'center', 0, 0, '000', 10)
        const qrUrl = avatars.getQR(`https://app.kronikle.eu/dq/${selectedDisplay.value}/date/${selectedDate.value}`).toString()
        const startDate = new Date(dates.find((d) => d.$id === selectedDate.value)?.startDateTime as unknown as string)
        const dateString = `${startDate.toLocaleDateString('fr', {month: 'short', year: 'numeric', day: '2-digit'})} ${startDate.toLocaleTimeString('fr', {hour: '2-digit', minute: '2-digit'})}`
        const truncatedDescription = removeMarkdown(props.event.description)
        //console.log(truncatedDescription)
        const truncatedName = props.event.name.length > 92 ? props.event.name.replace(/(\r\n|\n|\r)/gm, " ").substring(0, 92) + '...' : props.event.name.replace(/(\r\n|\n|\r)/gm, "")

        //const htmlDescription = converter.makeHtml(props.event.description)
        var doc = new jsPDF({
            orientation: "landscape",
        })

        //console.log(htmlDescription)

        for (let i = 0 ; i < 2 ; i++) {
            doc.setFillColor(242, 159, 32)
            doc.rect(15+135*i, 20, 46, 1, "F")
            doc.rect(15+135*i, 22, 92, 1, "F")
            doc.setFontSize(18)
            doc.setFont("helvetica", "bold")
            doc.text(truncatedName, 40+135*i, 32, {maxWidth:70})
            doc.setFontSize(9)
            doc.setFont("helvetica", "normal")
            doc.text(truncatedDescription, 40+135*i, 56, {maxWidth:100})
            doc.setFillColor(255, 255, 255)
            doc.rect(40+135*i, 141, 100, 100, "F")
            doc.setDrawColor(240, 240, 240)
            doc.rect(15+135*i, 15, 135, 180)
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.text("Flashez moi pour accéder aux ressources de cet événement !", 111+135*i, 146, {maxWidth:35})
            doc.setFontSize(24)
            doc.setFont("helvetica", "bold")
            doc.text(dateString, 20+135*i, 28, {angle: 270, maxWidth:123})
            if (coverUrl?.href) {
                doc.addImage(coverUrl.href, "JPEG", 20 + 135 * i, 135, 55, 55)
            }
            const selectedDisplayLogoId = (displays.find(dis => dis.$id === selectedDisplay.value) as KDisplay)?.logoId;
            const selectedDisplayLogoUrl = await storage.getFilePreview(
                'display-logo',
                selectedDisplayLogoId,
                0, // width (optional)
                0, // height (optional)
                'center', // gravity (optional)
                100, // quality (optional)
                5, // borderWidth (optional)
                'f29f20', // borderColor (optional)
                5, // borderRadius (optional)
                1, // opacity (optional)
                0, // rotation (optional)
                'f29f20', // background (optional)
                'png'// output (optional)
            )

            if (selectedDisplayLogoUrl && selectedDisplayLogoUrl.href) {
                // Here, we should get the original image size, an then resize it to fit in the box of 30x16 if the width is bigger than the height or less if the height is bigger than the width
                const imageSize = await getImageSize(selectedDisplayLogoUrl.href)
                const width = imageSize.width
                const height = imageSize.height
                const ratio = width / height
                if (ratio > 1) {
                    doc.addImage(selectedDisplayLogoUrl.href, "PNG", 110 + 135 * i, 20, 30, 30 / ratio)
                } else {
                    doc.addImage(selectedDisplayLogoUrl.href, "PNG", 110 + 135 * i, 20, 30 * ratio, 30)
                }
            }
            doc.addImage(qrUrl, "PNG", 110+135*i, 155, 35, 35)
        }
        doc.save(`bookmark-${props.event.$id}.pdf`);
    } 
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
                <option selected value="flyer">Flyer</option>
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
        <div v-show="!canGenerate" class="label mt-4 label-text">Veuillez remplir tous les champs pour générer le PDF</div>
        <div class="modal-action">
            <a class="btn btn-primary" @click="downloadPDF">Générer le PDF</a>
            <a class="btn btn-primary" @click="$emit('close')">Fermer</a>
        </div>
    </div>
</template>