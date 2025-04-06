const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("❌ MONGO_URI is not defined in .env file");
}

let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB ✅");
  }
  return client.db(dbName); // return the actual database, not just the client
}

module.exports = { connectToDatabase };
