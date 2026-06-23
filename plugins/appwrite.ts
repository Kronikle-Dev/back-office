import {Client, Account, Query, Databases, Models} from 'appwrite'

export default defineNuxtPlugin((nuxtApp) => { 
    const config = useRuntimeConfig()
    const client = new Client()
        .setEndpoint(config.public.AppwriteEndpoint) // Your API Endpoint
        .setProject(config.public.AppwriteProject);
    const account = new Account(client);
    
    const DB_LIMIT = 100

    async function fetchAllDocuments(
      databaseId: string,
      collectionId: string,
      queries: string[] = [],
    ): Promise<Models.Document[]> {
      const database = new Databases(client)
      const results: Models.Document[] = []
      let cursor: string | undefined

      do {
        const pageQueries = [...queries, Query.limit(DB_LIMIT)]
        if (cursor) pageQueries.push(Query.cursorAfter(cursor))

        const { documents } = await database.listDocuments(databaseId, collectionId, pageQueries)
        results.push(...documents)

        cursor = documents.length === DB_LIMIT ? documents[documents.length - 1].$id : undefined
      } while (cursor)

      return results
    }

    // Singleton Class for Appwrite
    class Appwrite {
        static client: Client = client;
        static account: Account = account;
        static getAllPages = fetchAllDocuments
    }

    return {
        provide: {
            appwrite: () => Appwrite,
        }
    }
})