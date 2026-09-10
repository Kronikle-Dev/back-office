import MarkdownIt from 'markdown-it'

// Rendu Markdown des descriptions d'événements (fiche back-office, affichages
// publics). Remplace showdown, qui avait des avis de sécurité sans correctif
// (ReDoS, XSS). `html: false` : le HTML brut saisi dans une description est
// affiché tel quel, pas interprété ; markdown-it bloque aussi les liens
// `javascript:`. Fonctionne côté serveur (pages /d/**) sans DOM.
const md = new MarkdownIt({
  html: false,
  linkify: true,
})

export function renderMarkdown (source: string | null | undefined): string {
  return md.render(source ?? '')
}
