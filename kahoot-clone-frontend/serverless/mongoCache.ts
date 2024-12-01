import { MongoClient, ServerApiVersion } from "mongodb";
let cachedDb: MongoClient | null = null;

export const connectToDatabase = async () => {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  const uri =
    "mongodb+srv://josemaeldon:trino005@cloudbr.p4jbd.mongodb.net/?retryWrites=true&w=majority&appName=Kahoot";
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  await client.connect();
  cachedDb = client;
  return cachedDb;
};
