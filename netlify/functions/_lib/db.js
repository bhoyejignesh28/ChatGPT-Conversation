import { MongoClient } from "mongodb";

let client;
let database;

export async function getDb() {
  if (database) return database;
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "filingscenter";
  if (!uri) {
    throw new Error("MONGODB_URI missing");
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);
  await database.collection("users").createIndex({ email: 1 }, { unique: true });
  return database;
}
