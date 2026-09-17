<script lang="ts" setup>
import { Databases, Query, Teams } from 'appwrite'
import { DateTime } from 'luxon'

const { $appwrite } = useNuxtApp()
const databases = new Databases($appwrite().client)
const route = useRoute()
definePageMeta({
  middleware: ["auth"],
  layout: "app",
})

const ZONE = 'Europe/Paris'
const PERIODS = [7, 30, 90] as const

let organization = ''
const teams = new Teams($appwrite().client)
const myTeams = await teams.list()
organization = myTeams.teams[0]?.$id ?? ''

const displayid = route.params.displayid as string
let display = null as unknown as KDisplay

try {
  display = (await databases.getDocument('kronikle', 'display', displayid)) as unknown as KDisplay
  if (display.organization != organization) {
    throw new Error("bad organization");
  }
} catch (e) {
  console.error('Bad display id : ', displayid, e)
  navigateTo('/')
}

const period = ref<number>(30)
const loading = ref(false)
const errorMessage = ref('')
const docs = ref<KDisplayUsage[]>([])

const periodStart = () =>
  DateTime.now().setZone(ZONE).startOf('day').minus({ days: period.value - 1 })

const load = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    docs.value = (await $appwrite().getAllPages('kronikle', 'display-usage', [
      Query.equal('displayId', displayid),
      Query.greaterThanEqual('$createdAt', periodStart().toUTC().toISO()!),
      Query.select(['$id', '$createdAt', 'kind', 'source', 'visitorId', 'durationSeconds',
        'interactions', 'clicks', 'scrolls', 'pageViews']),
      Query.orderAsc('$createdAt'),
    ], null, 1000)) as unknown as KDisplayUsage[]
  } catch (e) {
    console.error('display-usage', e)
    errorMessage.value = String(e)
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

watch(period, load, { immediate: true })

// --- Agrégation ---

const visits = computed(() => docs.value.filter(d => d.kind === 'visit'))
const sessions = computed(() => docs.value.filter(d => d.kind === 'session'))

const sum = (list: KDisplayUsage[], key: keyof KDisplayUsage) =>
  list.reduce((acc, d) => acc + (Number(d[key]) || 0), 0)

const totals = computed(() => ({
  visits: visits.value.length,
  qrVisits: visits.value.filter(v => v.source === 'qr').length,
  uniqueVisitors: new Set(visits.value.map(v => v.visitorId)).size,
  interactions: sum(sessions.value, 'interactions'),
  clicks: sum(sessions.value, 'clicks'),
  scrolls: sum(sessions.value, 'scrolls'),
  sessions: sessions.value.length,
  avgDurationSeconds: sessions.value.length
    ? Math.round(sum(sessions.value, 'durationSeconds') / sessions.value.length)
    : 0,
}))

interface DayBucket { key: string, label: string, visits: number, sessions: number }

const days = computed<DayBucket[]>(() => {
  const start = periodStart()
  const buckets = new Map<string, DayBucket>()
  for (let i = 0; i < period.value; i++) {
    const day = start.plus({ days: i })
    const key = day.toISODate()!
    buckets.set(key, { key, label: day.setLocale('fr-FR').toFormat('d/M'), visits: 0, sessions: 0 })
  }
  for (const doc of docs.value) {
    if (!doc.$createdAt) continue
    const key = DateTime.fromISO(doc.$createdAt).setZone(ZONE).toISODate()
    const bucket = key ? buckets.get(key) : undefined
    if (!bucket) continue
    if (doc.kind === 'visit') bucket.visits++
    else bucket.sessions++
  }
  return [...buckets.values()]
})

const chartMax = computed(() =>
  Math.max(1, ...days.value.map(d => Math.max(d.visits, d.sessions))))

// Un libellé de jour tous les N jours pour rester lisible
const labelEvery = computed(() => period.value <= 7 ? 1 : period.value <= 30 ? 5 : 15)

const barHeight = (value: number) => `${Math.round(value / chartMax.value * 100)}%`

const fmtDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} min ${s} s` : `${s} s`
}

const fmtNumber = (n: number) => n.toLocaleString('fr-FR')
</script>

<template>
  <div class="max-w-3xl mx-auto prose">
    <NuxtLink :to="`/display/${displayid}`" class="btn btn-ghost btn-sm no-underline">← {{ $t('display.stats.back') }}</NuxtLink>
    <h2>{{ $t('display.stats.title', { name: display?.name ?? '' }) }}</h2>

    <div class="not-prose flex flex-wrap items-center justify-between gap-3 my-4">
      <div class="join">
        <button v-for="p in PERIODS" :key="p"
          class="btn btn-sm join-item"
          :class="period === p ? 'btn-primary' : 'btn-outline'"
          @click="period = p">
          {{ $t(`display.stats.period-${p}`) }}
        </button>
      </div>
      <span v-if="loading" class="loading loading-spinner loading-sm"></span>
    </div>

    <div v-if="!loading && docs.length === 0" class="not-prose alert my-6">
      <span>{{ $t('display.stats.empty') }}</span>
    </div>

    <div v-else class="not-prose">
      <div class="stats stats-vertical sm:stats-horizontal shadow bg-white w-full">
        <div class="stat">
          <div class="stat-title">{{ $t('display.stats.visits') }}</div>
          <div class="stat-value text-primary">{{ fmtNumber(totals.visits) }}</div>
          <div class="stat-desc">{{ $t('display.stats.qr-share', { n: fmtNumber(totals.qrVisits) }) }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ $t('display.stats.unique-visitors') }}</div>
          <div class="stat-value text-primary">{{ fmtNumber(totals.uniqueVisitors) }}</div>
        </div>
      </div>
      <div class="stats stats-vertical sm:stats-horizontal shadow bg-white w-full mt-4">
        <div class="stat">
          <div class="stat-title">{{ $t('display.stats.interactions') }}</div>
          <div class="stat-value text-secondary">{{ fmtNumber(totals.interactions) }}</div>
          <div class="stat-desc">{{ $t('display.stats.interactions-detail', { clicks: fmtNumber(totals.clicks), scrolls: fmtNumber(totals.scrolls) }) }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ $t('display.stats.sessions') }}</div>
          <div class="stat-value text-secondary">{{ fmtNumber(totals.sessions) }}</div>
          <div class="stat-desc">{{ $t('display.stats.avg-duration', { d: fmtDuration(totals.avgDurationSeconds) }) }}</div>
        </div>
      </div>

      <ul class="text-sm text-base-content/60 mt-4 space-y-1">
        <li><strong>{{ $t('display.stats.visits') }}</strong> : {{ $t('display.stats.visits-help') }}</li>
        <li><strong>{{ $t('display.stats.unique-visitors') }}</strong> : {{ $t('display.stats.unique-visitors-help') }}</li>
        <li><strong>{{ $t('display.stats.interactions') }}</strong> : {{ $t('display.stats.interactions-help') }}</li>
        <li><strong>{{ $t('display.stats.sessions') }}</strong> : {{ $t('display.stats.sessions-help') }}</li>
      </ul>

      <section class="card bg-white shadow mt-6">
        <div class="card-body">
          <h3 class="card-title text-lg">{{ $t('display.stats.chart-title') }}</h3>
          <div class="flex items-end gap-px h-48 mt-2">
            <div v-for="(day, i) in days" :key="day.key"
              class="flex-1 min-w-0 h-full flex flex-col justify-end"
              :title="`${day.label} : ${day.visits} ${$t('display.stats.legend-visits').toLowerCase()}, ${day.sessions} ${$t('display.stats.legend-sessions').toLowerCase()}`">
              <div class="flex items-end justify-center gap-px h-full">
                <div class="w-1/2 bg-primary rounded-t-sm" :style="{ height: barHeight(day.visits) }"></div>
                <div class="w-1/2 bg-secondary rounded-t-sm" :style="{ height: barHeight(day.sessions) }"></div>
              </div>
              <div class="text-[10px] text-center text-base-content/60 h-4 overflow-hidden">
                <span v-if="i % labelEvery === 0">{{ day.label }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-4 text-sm mt-2">
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-primary rounded-sm"></span>{{ $t('display.stats.legend-visits') }}</span>
            <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-secondary rounded-sm"></span>{{ $t('display.stats.legend-sessions') }}</span>
          </div>
        </div>
      </section>
    </div>

    <p class="text-sm text-base-content/60 mt-6">{{ $t('display.stats.members-not-counted') }}</p>

    <div v-if="errorMessage" class="toast toast-end z-50">
      <div class="alert alert-error"><span>{{ $t('display.stats.error') }}</span></div>
    </div>
  </div>
</template>
