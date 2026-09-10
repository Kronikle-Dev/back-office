// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
  ],
  routeRules: {
    // `/**` (et non `/*`, qui ne couvre qu'un segment) : tout le back-office est
    // une SPA, sinon les pages imbriquées (/event/new, /display/:id…) passent en
    // SSR et le middleware auth, sans session côté serveur, redirige vers /login.
    '/**': {
      ssr: false,
    },
    '/d/**': {
      ssr: true,
    },
    '/dqr/**': {
      ssr: true,
    },
    // `/dq/**` est le préfixe encodé dans les QR codes (ThemePanel, ExploreEvent,
    // PrintForm) : il doit bénéficier du même rendu serveur que `/d/**`.
    '/dq/**': {
      ssr: true,
    },
  },
  app: {
    head: {
      title: "Kronikle",
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.png'
        }
      ],
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1"
        },
        {
          charset: "utf-8"
        },
        {
          name: 'description',
          content: 'Kronikle est un outil qui vous permet d\'enrichir vos événements et de les rendre visibles'
        },
        {
          property: 'og:type',
          content: 'website'
        },
        {
          property: 'og:title',
          content: 'Kronikle'
        },
        {
          property: 'og:description',
          content: 'Kronikle est un outil qui vous permet d\'enrichir vos événements et de les rendre visibles'
        },
        {
          property: 'og:image',
          content: 'https://www.kronikle.eu/wp-content/uploads/2021/03/cropped-Frame-12.png'
        },
        {
          property: 'og:url',
          content: 'https://kronikle.eu'
        }
      ],
    },
  },
  runtimeConfig: {
    public: {
      AppwriteProject: import.meta.env.NUXT_PUBLIC_APPWRITE_PROJECT || 'kronikle',
      AppwriteEndpoint: "https://appwrite.kronikle.eu/v1",
      Hostname: import.meta.env.NUXT_PUBLIC_APPWRITE_PROJECT ? 'https://app.kronikle.eu' : 'http://localhost:3000',
    }
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },
  vite: {
    build: {
      sourcemap: true,
    },
  },
})
