/**
 * Suivi d'usage des affichages publics (collection Appwrite `display-usage`).
 *
 * Monté une seule fois depuis `layouts/display.vue`, qui reste en place entre
 * `/d/:id` et `/d/:id/date/:dateid` : la session d'interaction survit donc aux
 * navigations internes. Deux types de documents sont produits :
 *  - `visit`   : un par chargement de page publique (logique web classique) ;
 *  - `session` : une par « session d'interaction » : elle démarre au premier
 *    geste, chaque geste relance un compte à rebours de INACTIVITY_MS, et elle
 *    est close (et envoyée) quand il expire. C'est le compteur pertinent pour
 *    une borne tactile chargée une fois et utilisée par de nombreuses personnes.
 *
 * Les écritures passent par l'API REST en `fetch` keepalive (et non par le SDK)
 * pour survivre à la fermeture de l'onglet. Les membres connectés de
 * l'organisation (prévisualisation) ne sont pas comptés.
 */

const INACTIVITY_MS = 60_000
const THROTTLE_MS = 1_000
const VISITOR_KEY = 'kronikle:visitorId'
const MEMBER_CHECK_TIMEOUT_MS = 2_000

type InteractionType = 'click' | 'scroll' | 'key'

interface OpenSession {
  startedAt: number
  lastActivityAt: number
  clicks: number
  scrolls: number
  keys: number
  pageViews: number
}

export function useDisplayTracking () {
  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()
  const { $appwrite } = useNuxtApp()

  const currentDisplayId = () => (route.params.displayid as string | undefined) || undefined
  const currentSource = (): KDisplayUsage['source'] =>
    route.params.qr && (route.params.qr as string).length > 0 ? 'qr' : 'direct'

  let displayId = ''
  let source: KDisplayUsage['source'] = 'direct'
  let visitorId = ''
  let session: OpenSession | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  const lastCountAt: Record<InteractionType, number> = { click: 0, scroll: 0, key: 0 }

  const randomId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  const getVisitorId = () => {
    try {
      const stored = localStorage.getItem(VISITOR_KEY)
      if (stored) return stored
      const fresh = randomId()
      localStorage.setItem(VISITOR_KEY, fresh)
      return fresh
    } catch {
      // Stockage indisponible (navigation privée, données bloquées) : identifiant par chargement
      return randomId()
    }
  }

  const post = (data: KDisplayUsage) => {
    fetch(`${config.public.AppwriteEndpoint}/databases/kronikle/collections/display-usage/documents`, {
      method: 'POST',
      keepalive: true,
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': config.public.AppwriteProject,
      },
      body: JSON.stringify({ documentId: 'unique()', data }),
    }).catch((e) => console.error('display-usage', e))
  }

  const base = (): Pick<KDisplayUsage, 'displayId' | 'source' | 'visitorId' | 'path'> => ({
    displayId,
    source,
    visitorId,
    path: route.path,
  })

  const startDisplay = (id: string) => {
    displayId = id
    source = currentSource()
    post({ kind: 'visit', ...base() })
  }

  const endSession = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!session) return
    const s = session
    session = null
    post({
      kind: 'session',
      ...base(),
      startedAt: new Date(s.startedAt).toISOString(),
      endedAt: new Date(s.lastActivityAt).toISOString(),
      durationSeconds: Math.round((s.lastActivityAt - s.startedAt) / 1000),
      clicks: s.clicks,
      scrolls: s.scrolls,
      keys: s.keys,
      interactions: s.clicks + s.scrolls + s.keys,
      pageViews: s.pageViews,
    })
  }

  const armTimer = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(endSession, INACTIVITY_MS)
  }

  const onInteraction = (type: InteractionType) => {
    const now = Date.now()
    if (type !== 'click') {
      if (now - lastCountAt[type] < THROTTLE_MS) return
      lastCountAt[type] = now
    }
    if (!session) {
      session = { startedAt: now, lastActivityAt: now, clicks: 0, scrolls: 0, keys: 0, pageViews: 0 }
    }
    if (type === 'click') session.clicks++
    else if (type === 'scroll') session.scrolls++
    else session.keys++
    session.lastActivityAt = now
    armTimer()
  }

  // `click` plutôt que `pointerdown` : un geste de défilement tactile commence par un pointerdown.
  // `wheel`/`touchmove` plutôt que `scroll` : ExploreHome fait un scrollTo() programmatique au
  // montage, qui ouvrirait une session fantôme.
  const onClick = () => onInteraction('click')
  const onScroll = () => onInteraction('scroll')
  const onKey = () => onInteraction('key')
  const onPageHide = () => endSession()
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') endSession()
  }
  const listenerOptions: AddEventListenerOptions = { capture: true, passive: true }

  let unregisterAfterEach: (() => void) | null = null
  let stopWatch: (() => void) | null = null
  let listening = false

  const addListeners = () => {
    document.addEventListener('click', onClick, listenerOptions)
    document.addEventListener('wheel', onScroll, listenerOptions)
    document.addEventListener('touchmove', onScroll, listenerOptions)
    document.addEventListener('keydown', onKey, listenerOptions)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    listening = true
  }

  const removeListeners = () => {
    if (!listening) return
    document.removeEventListener('click', onClick, listenerOptions)
    document.removeEventListener('wheel', onScroll, listenerOptions)
    document.removeEventListener('touchmove', onScroll, listenerOptions)
    document.removeEventListener('keydown', onKey, listenerOptions)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    listening = false
  }

  onMounted(async () => {
    const initialId = currentDisplayId()
    if (!initialId) return

    // Membre connecté (prévisualisation depuis le back-office) : pas de suivi.
    // Le 401 visible en console pour les visiteurs anonymes est attendu.
    const isMember = await Promise.race<boolean>([
      $appwrite().account.get().then(() => true, () => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), MEMBER_CHECK_TIMEOUT_MS)),
    ])
    if (isMember) return

    visitorId = getVisitorId()
    startDisplay(initialId)
    addListeners()

    unregisterAfterEach = router.afterEach((to) => {
      // Une navigation sans session ouverte (ex. redirection programmatique) n'est pas un geste.
      if (!session) return
      if (to.params.displayid !== displayId) return
      session.pageViews++
      session.lastActivityAt = Date.now()
      armTimer()
    })

    stopWatch = watch(currentDisplayId, (next, prev) => {
      if (!next || next === prev) return
      endSession()
      startDisplay(next)
    })
  })

  onBeforeUnmount(() => {
    endSession()
    removeListeners()
    unregisterAfterEach?.()
    stopWatch?.()
  })
}
