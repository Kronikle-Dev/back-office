<script lang="ts" setup>
// Contenu d'une séance dans le calendrier SVAR (prop `eventContent`).
// Remplace le rendu par défaut de la vue mois, qui affiche l'heure au format
// anglais 12 h (« 10pm ») quelle que soit la locale. Les styles SVAR étant
// scoped, on style ici avec Tailwind ; la couleur du texte est héritée du bloc
// parent rendu par SVAR.
import { DateTime } from 'luxon'

defineProps<{
  event: { start: Date, end: Date, text?: string },
  mode: string, // 'grid' (vue mois), 'boxes' (grille horaire semaine/jour), 'bars' (multi-jours)
}>()

const fmt = (d: Date) =>
  DateTime.fromJSDate(d).setLocale('fr-FR').toLocaleString({ hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <span v-if="mode === 'grid'" class="flex items-center gap-1 min-w-0 text-xs leading-5">
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0"></span>
    <b class="shrink-0">{{ fmt(event.start) }}</b>
    <span class="truncate">{{ event.text }}</span>
  </span>
  <span v-else-if="mode === 'boxes'" class="block min-w-0 text-xs leading-4">
    <b class="block">{{ fmt(event.start) }} – {{ fmt(event.end) }}</b>
    <span class="block truncate">{{ event.text }}</span>
  </span>
  <span v-else class="block truncate text-xs leading-5">{{ event.text }}</span>
</template>
