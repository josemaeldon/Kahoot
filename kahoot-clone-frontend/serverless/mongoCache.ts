import { MongoClient, ServerApiVersion } from "mongodb";
let cachedDb: MongoClient | null = null;

export const connectToDatabase = async () => {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  const uri =
    "mongodb://root:Trino005%40@137.184.221.75:27017/kahoot?authSource=";
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  await client.connect();
  cachedDb = client;
  return cachedDb;
};
