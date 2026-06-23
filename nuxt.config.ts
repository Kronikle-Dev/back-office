// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
  ],
  routeRules: {
    '/*': {
      ssr: false,
    },
    '/d/*': {
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
