// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
  ],
  runtimeConfig: {
    public: {
      appwriteProject: process.env.NUXT_PUBLIC_APPWRITE_PROJECT || 'kronikle'
    }
  },
  // @ts-ignore
  i18n: {
    vueI18n: {
      legacy: false,
      locale: 'fr',
      messages: {
        fr: require('./locales/fr.json'),
      }
    }
  }
})
