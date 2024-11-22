import { MongoClient, ServerApiVersion } from "mongodb";
let cachedDb: MongoClient | null = null;

export const connectToDatabase = async () => {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  const uri =
    "mongodb+srv://haotian:haotian@kahoot.3jyhz.mongodb.net/?retryWrites=true&w=majority&appName=Kahoot";
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  await client.connect();
  cachedDb = client;
  return cachedDb;
};
