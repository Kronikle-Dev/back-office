# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Back-office **Kronikle** : application Nuxt 4 (Vue 3, TypeScript) qui permet à une organisation de gérer ses événements, de les enrichir de ressources documentaires et de les publier sur des « affichages » publics (écrans, QR codes). Le backend est une instance **Appwrite** auto-hébergée (`https://appwrite.kronikle.eu/v1`, serveur 1.9.0) ; il n'y a pas de base de données ni d'API métier dans ce dépôt.

L'interface, les commentaires et les messages de commit sont en français. Une seule locale (`fr`) est déclarée dans `locales/fr.json` ; tout texte visible passe par `$t(...)`.

## Commandes

```bash
npm install          # lance aussi `nuxt prepare` (génère .nuxt/ et le tsconfig étendu)
npm run dev          # serveur de dev sur http://localhost:3000
npm run build        # build Nitro (déployé sur Netlify, cf. netlify.toml)
npm run preview      # prévisualisation du build
npx nuxt typecheck   # vérification TypeScript (vue-tsc n'est pas installé : nuxt proposera de l'ajouter)
```

Il n'y a **ni tests, ni linter** configurés. La vérification se fait via `npx nuxt typecheck` et en lançant l'app.

Variable d'environnement : `NUXT_PUBLIC_APPWRITE_PROJECT` (projet Appwrite, défaut `kronikle`). Sa seule présence bascule aussi `Hostname` vers `https://app.kronikle.eu` (voir `nuxt.config.ts`).

## Architecture

### Rendu : SPA sauf les pages publiques

`nuxt.config.ts` désactive le SSR partout (`/**`) **sauf** sur `/d/**` et `/dqr/**`, les pages d'affichage public. Attention : dans les `routeRules` Nitro, `/*` ne couvre qu'un segment ; utiliser `/**` sinon les pages imbriquées passent en SSR et le middleware auth redirige vers `/login`. Conséquences :

- Les pages du back-office (`app/pages/**` hors `d[[qr]]/`) s'exécutent uniquement côté client ; les appels Appwrite au top-level du `<script setup>` sont donc acceptables.
- Les pages `d[[qr]]/…` sont rendues côté serveur : attention aux accès à `window`/`localStorage` et aux mismatchs d'hydratation (cf. commit f8fd973).

### Accès à Appwrite

- `app/plugins/appwrite.ts` fournit `$appwrite()` : un singleton avec `client`, `account` et `getAllPages(db, collection, queries)` qui pagine automatiquement par 100 via `cursorAfter`. Utiliser `getAllPages` plutôt que `listDocuments` dès qu'on peut dépasser 100 documents.
- Le SDK `appwrite` (v26) est importé directement dans les composants pour `Databases`, `Teams`, `Storage`, `Query`, `Permission`, `Role`.
- Base : `kronikle`. Collections : `event`, `date`, `resource`, `display`, `tag`, `public-type`, `event-type`. Buckets : `event-thumbnails`, `resource-file`, `display-logo`.
- Les types des documents sont déclarés globalement (sans import) dans `app/types/types.d.ts` : `KEvent`, `KDate`/`KDateApi`, `KResource`, `KDisplay`, `KImportEvent`…
- **Images** : toujours passer les URLs de fichiers Appwrite par `imgSrc()` (`app/utils/storage.ts`) et utiliser `getFileView`, jamais `getFilePreview` : l'endpoint `/preview` renvoie une 500 sur le serveur 1.9.0.

### Modèle multi-organisation

L'« organisation » est une **Team Appwrite**. Le pattern répété dans les pages et composants : `new Teams(client).list()` puis `teams[0].$id` sert d'`organization`. Les documents créés reçoivent les permissions `read: any`, `update/delete: team(org)`. Les pages de détail vérifient que `event.organization` correspond à l'équipe courante avant d'afficher.

Les référentiels `tag`, `public-type`, `event-type` sont filtrés par `author == organization` (ou `'all'` pour les entrées partagées).

### Événements et dates

Un `KEvent` est un document `event` ; ses occurrences sont des documents `date` séparés (`eventId`). Les listes chargent donc d'abord les événements, puis toutes leurs dates via `Query.equal('eventId', [...ids])`. Un événement supprimé passe en `status: 'archived'` (corbeille) et les requêtes ajoutent `Query.notEqual('status', 'archived')`.

Appwrite n'a pas de requête « contains » sur les tableaux : les filtres par tags/publics/types des affichages sont appliqués **côté client** après récupération.

### Assistant de création/édition d'événement

`pages/event/new.vue` et `pages/event/edit/[eventid].vue` montent `components/event/NewContainer.vue`, qui affiche `New1` à `New6` selon `store.step`. Tout l'état vit dans le store Pinia `app/stores/eventDraft.ts` (`useEventDraftStore`) : `initForCreate(teamId)` / `initFromExisting(event, dates)`, `updateFragment()`, `setDates()`, `fetchReferenceData()`, puis `publish()` qui crée ou met à jour l'événement et insère les dates marquées `new`. Chaque étape valide son formulaire avec Vuelidate avant d'appeler `store.nextStep()`.

### Affichages publics (`/d/:displayid`, `/dqr/:displayid`)

Le segment optionnel `d[[qr]]` permet la variante `/dqr/...` destinée aux QR codes (`qr` = true). Un `KDisplay` définit un `eventFilter` (`month`, `week`, `upcoming`, `past`, `all`, `none`), des filtres tags/publics/types (`excludeFilters` inverse la logique) et une liste `events` supplémentaires. La page résout les IDs à partir des `date`, charge les événements, puis délègue au template `components/template/ExploreHome.vue` (seul template actif : `explore-v3`). Ces templates forcent le thème DaisyUI `urfist` via `useHead`.

### Routes serveur (Nitro)

- `server/api/open-graph.get.ts` : scrape les métadonnées OG d'une URL (ou oEmbed Twitter) pour les ressources de type lien.
- `server/api/third-party/sygefor-33/` : importeur d'événements depuis l'API Sygefor (réseau URFIST). `list.get.ts` interroge l'API Elasticsearch de Sygefor, `event/[eventId].get.ts` convertit une formation en `KImportEvent` (HTML → Markdown via `node-html-markdown`). Le nom du dossier (`sygefor-33`) doit correspondre à l'ID de team utilisé par `pages/event/import.vue`, qui construit l'URL `/api/third-party/${organization}/...`. L'`organizationId` Sygefor est dans `shared/sygefor.ts`.

### Layouts et auth

- `layouts/app.vue` : back-office avec `SideBar` ; `layouts/blank.vue` : login/signup/recovery ; `layouts/display.vue` : pages publiques.
- `middleware/auth.ts` redirige vers `/login` si `account.get()` échoue. Toute page du back-office déclare `definePageMeta({ middleware: ["auth"], layout: "app" })`.
- Certaines fonctionnalités (import) sont réservées aux comptes portant le label Appwrite `premium`.

### Style

Tailwind + DaisyUI (thèmes `autumn`, `light`, `urfist`) avec une palette personnalisée dans `tailwind.config.js` (`urfist-*`, `primary-*-kv3`). Le plugin `@tailwindcss/typography` sert au rendu Markdown (`showdown`) des descriptions.

## Git

Branche de travail `main` ; `prod` reçoit les merges depuis `main` pour le déploiement Netlify.
