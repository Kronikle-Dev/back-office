<script setup lang="ts">
// Visuel d'un événement (affichages publics et back-office) : l'image si elle
// existe et se charge, sinon un substitut généré (dégradé stable dérivé du nom
// + initiales), pour que les événements sans image restent lisibles et cohérents.
// Seuls `name` et `imageUrl` sont nécessaires, ce qui permet de passer aussi le
// brouillon du store `eventDraft`.
const props = defineProps<{
  event: { name?: string | null, imageUrl?: string | null } | null,
}>()

// Dégradés tirés de la palette `urfist-*` / `primary-*-kv3` de tailwind.config.js.
// `ink` : couleur des initiales, choisie pour le contraste avec chaque dégradé.
const PALETTES = [
  { from: '#F29F20', to: '#e85724', ink: '#11192C' }, // urfist-100 → urfist-50
  { from: '#C7E8FA', to: '#9DB8CD', ink: '#242F46' }, // urfist-500 → urfist-600
  { from: '#FAAF5E', to: '#FFDFB2', ink: '#39445A' }, // urfist-200 → urfist-300
  { from: '#56647F', to: '#242F46', ink: '#F8F9FC' }, // primary-400 → primary-200
  { from: '#D3C0A7', to: '#FEEDD4', ink: '#39445A' }, // urfist-700 → urfist-400
  { from: '#8B99B1', to: '#C5D0E0', ink: '#11192C' }, // primary-500 → primary-600
]

const broken = ref(false)
watch(() => props.event?.imageUrl, () => { broken.value = false })

const src = computed(() => imgSrc(props.event?.imageUrl))
const showImage = computed(() => src.value.length > 0 && !broken.value)

// Hash déterministe (djb2) du nom : le même événement garde toujours le même dégradé.
const palette = computed(() => {
  const name = props.event?.name ?? ''
  let hash = 5381
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0
  return PALETTES[Math.abs(hash) % PALETTES.length]!
})

// Initiales : première lettre des deux premiers mots « significatifs ». On
// ignore les préfixes entre crochets/parenthèses (« [Online Course] », « [A
// distance] »), la ponctuation et les mots courts, sauf les sigles en capitales.
const initials = computed(() => {
  const name = props.event?.name ?? ''
  const stripped = name.replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').trim() || name
  const words = stripped
    .replace(/[\[\]()«»"'’:;,.!?\-–—/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 || /^[A-Z0-9]{2,}$/.test(w))
  const letters = words.slice(0, 2).map(w => w.charAt(0).toUpperCase())
  return letters.join('') || '•'
})

const background = computed(() => `linear-gradient(135deg, ${palette.value.from} 0%, ${palette.value.to} 100%)`)
</script>

<template>
  <img
    v-if="showImage"
    :src="src"
    :alt="event?.name ?? ''"
    loading="lazy"
    @error="broken = true"/>
  <div
    v-else
    role="img"
    :aria-label="event?.name ?? ''"
    class="relative overflow-hidden aspect-video select-none"
    :style="{ background }">
    <!-- Motif discret : deux disques translucides pour donner du relief au dégradé -->
    <div class="absolute -right-6 -top-10 w-32 h-32 rounded-full bg-white/15"></div>
    <div class="absolute -left-8 -bottom-12 w-28 h-28 rounded-full bg-white/10"></div>
    <div
      class="absolute inset-0 flex items-center justify-center font-black text-4xl md:text-5xl tracking-wide"
      :style="{ color: palette.ink, opacity: 0.85 }">
      {{ initials }}
    </div>
  </div>
</template>
