import Appwrite from "~~/utils/appwrite"

export default defineNuxtRouteMiddleware( async (to, from) => {
  const account = Appwrite.account
  try {
    const accountStatus = await account.get()
    console.log(accountStatus)
  } catch (e) {
    console.error(e)
    navigateTo('/login')
  }
})
