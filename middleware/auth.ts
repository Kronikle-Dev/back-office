const { $appwrite } = useNuxtApp()

export default defineNuxtRouteMiddleware( async (to, from) => {
  const account = $appwrite().account
  try {
    const accountStatus = await account.get()
    //console.log(accountStatus)
  } catch (e) {
    //console.error(e)
    navigateTo('/login')
  }
})
