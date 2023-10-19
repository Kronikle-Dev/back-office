// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
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
          hid: 'og-type',
          property: 'og:type',
          content: 'website'
        },
        {
          hid: 'og-title',
          property: 'og:title',
          content: 'Kronikle'
        },
        {
          hid: 'og-desc',
          property: 'og:description',
          content: 'Kronikle est un outil qui vous permet d\'enrichir vos événements et de les rendre visibles'
        },
        {
          hid: 'og-image',
          property: 'og:image',
          content: 'https://www.kronikle.eu/wp-content/uploads/2021/03/cropped-Frame-12.png'
        },
        {
          hid: 'og-url',
          property: 'og:url',
          content: 'https://kronikle.eu'
        }
      ],
    },
  },
  runtimeConfig: {
    public: {
      AppwriteProject: process.env.NUXT_PUBLIC_APPWRITE_PROJECT || 'kronikle',
      AppwriteEndpoint: "https://appwrite.kronikle.eu/v1",
      Hostname: process.env.NUXT_PUBLIC_APPWRITE_PROJECT ? 'https://app.kronikle.eu' : 'http://localhost:3000',
    }
  },
  // @ts-ignore
  i18n: {
    vueI18n: './nuxt-i18n.js',
  },
  build: {
    // @ts-ignore
    extend(config, ctx) {
      if (ctx.isDev) {
        config.devtool = ctx.isClient ? 'source-map' : 'inline-source-map'
      }
    }
  },
})
