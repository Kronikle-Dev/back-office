import {Client, Account} from 'appwrite'



export default defineNuxtPlugin((nuxtApp) => { 
    const config = useRuntimeConfig()
    const client = new Client()
        .setEndpoint('https://appwrite.krlx.ovh/v1') // Your API Endpoint
        .setProject(config.public.appwriteProject);
    const account = new Account(client);
    
    // Singleton Class for Appwrite
    class Appwrite {
        static client: Client = client;
        static account: Account = account;
    }

    return {
        provide: {
            appwrite: () => Appwrite
        }
    }
})