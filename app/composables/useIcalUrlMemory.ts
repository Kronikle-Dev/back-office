import { Teams } from 'appwrite'

const MAX_URLS = 10
const PREF_KEY = 'icalUrls'

function normalizeList (value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

/**
 * Mémorise les URLs de calendrier déjà utilisées. Elles sont partagées via les
 * préférences de la team ; les membres qui ne sont pas propriétaires de l'équipe
 * n'ont pas le droit de les écrire, on retombe alors sur leurs préférences de compte.
 */
export function useIcalUrlMemory (teamId: string) {
  const { $appwrite } = useNuxtApp()
  const teams = new Teams($appwrite().client)
  const urls = ref<string[]>([])

  async function load () {
    const [teamPrefs, accountPrefs] = await Promise.all([
      teamId ? teams.getPrefs(teamId).catch(() => ({} as Record<string, unknown>)) : Promise.resolve({} as Record<string, unknown>),
      $appwrite().account.getPrefs().catch(() => ({} as Record<string, unknown>)),
    ])
    const merged = [...normalizeList((teamPrefs as any)[PREF_KEY]), ...normalizeList((accountPrefs as any)[PREF_KEY])]
    urls.value = merged.filter((url, index) => merged.indexOf(url) === index).slice(0, MAX_URLS)
  }

  async function save (list: string[]) {
    // Fusion dans les deux cas : les prefs portent aussi `nom`/`prenom` (cf. signup.vue).
    if (teamId) {
      try {
        const current = await teams.getPrefs(teamId).catch(() => ({} as Record<string, unknown>))
        await teams.updatePrefs(teamId, { ...current, [PREF_KEY]: list })
        return
      } catch (e) {
        console.log('Préférences de team non modifiables, repli sur le compte', e)
      }
    }
    try {
      const current = await $appwrite().account.getPrefs().catch(() => ({} as Record<string, unknown>))
      await $appwrite().account.updatePrefs({ ...current, [PREF_KEY]: list })
    } catch (e) {
      console.log('Impossible de mémoriser l\'URL du calendrier', e)
    }
  }

  async function remember (url: string) {
    const cleaned = url.trim()
    if (!cleaned) return
    urls.value = [cleaned, ...urls.value.filter(u => u !== cleaned)].slice(0, MAX_URLS)
    await save(urls.value)
  }

  async function forget (url: string) {
    urls.value = urls.value.filter(u => u !== url)
    await save(urls.value)
  }

  return { urls, load, remember, forget }
}
