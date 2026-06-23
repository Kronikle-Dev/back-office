// Contourne le bug de l'endpoint Appwrite /preview (serveur 1.9.0) qui renvoie
// une 500 sur le bucket event-thumbnails : la réponse JSON est bloquée par ORB
// quand elle est chargée dans une <img>, d'où les images cassées.
// On bascule sur /view, qui sert le fichier brut sans transformation.
export function imgSrc(url?: string | null): string {
  if (!url) return ''
  return url.replace('/preview?', '/view?').replace(/\/preview$/, '/view')
}
