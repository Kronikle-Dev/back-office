// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
  ],
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
