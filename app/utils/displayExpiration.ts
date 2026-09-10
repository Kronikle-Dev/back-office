import { DateTime } from 'luxon'
import { Query } from 'appwrite'

// Péremption des séances d'un affichage : `maxEventAgeMonths` (attribut optionnel
// de la collection `display`) masque les `date` dont `startDateTime` est
// antérieure à maintenant moins N mois. null, absent ou 0 = illimité.

// Date ISO en deçà de laquelle les séances sont « périmées », ou null si illimité.
export function eventExpirationCutoff(display: Pick<KDisplay, 'maxEventAgeMonths'>): string | null {
  const months = Number(display.maxEventAgeMonths ?? 0)
  if (!Number.isFinite(months) || months <= 0) return null
  return DateTime.now().minus({ months }).toISO() as string
}

// Requêtes à ajouter aux lectures de la collection `date` ; [] si illimité.
export function expirationDateQueries(display: Pick<KDisplay, 'maxEventAgeMonths'>): string[] {
  const cutoff = eventExpirationCutoff(display)
  return cutoff ? [Query.greaterThanEqual('startDateTime', cutoff)] : []
}
