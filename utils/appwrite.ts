import {Client, Account} from 'appwrite';

const client = new Client()
    .setEndpoint('https://appwrite.krlx.ovh/v1') // Your API Endpoint
    .setProject('kronikle');
const account = new Account(client);

// Singleton Class for Appwrite
export default class Appwrite {
    static client: Client = client;
    static account: Account = account;
}