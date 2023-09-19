import {Client, Account, Query, Databases, Models} from 'appwrite'

export default defineNuxtPlugin((nuxtApp) => { 
    const config = useRuntimeConfig()
    const client = new Client()
        .setEndpoint(config.public.AppwriteEndpoint) // Your API Endpoint
        .setProject(config.public.AppwriteProject);
    const account = new Account(client);
    
    // Singleton Class for Appwrite
    class Appwrite {
        static client: Client = client;
        static account: Account = account;
        static async getAllPages (databaseid: string, collectionId: string, queries: string[] = [], cursor: string | null = null) : Promise<Models.Document[]> {
            
            const database = new Databases(this.client)
            const currentQueries = [
              ...queries,
              Query.limit(100)
            ];
      
            if (cursor) {
              currentQueries.push(Query.cursorAfter(cursor));
            }
      
            const response = await database.listDocuments(databaseid, collectionId, currentQueries);
      
            if (response.documents.length < 100) {
              return response.documents;
            }
      
            const nextCursor = response.documents[response.documents.length - 1].$id
      
            return [
              ...response.documents,
              ...(await this.getAllPages(databaseid, collectionId, queries, nextCursor))
            ]
          }
    }

    return {
        provide: {
            appwrite: () => Appwrite,
        }
    }
})