import { MongoClient, ServerApiVersion } from "mongodb";
let cachedDb: MongoClient | null = null;

export const connectToDatabase = async () => {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  const uri =
    "mongodb+srv://admin:admin@kahoot-clone.3j3xa.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  await client.connect();
  cachedDb = client;
  return cachedDb;
};
