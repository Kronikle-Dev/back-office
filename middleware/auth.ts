const { $appwrite } = useNuxtApp()

export default defineNuxtRouteMiddleware( async (to, from) => {
  const account = $appwrite().account
  try {
    await account.get()
    //console.log(accountStatus)
  } catch (e) {
    return navigateTo('/login')
  }
})
