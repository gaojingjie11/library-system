const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || `mongodb://${process.env.MONGODB_HOST || '127.0.0.1'}:${process.env.MONGODB_PORT || '27017'}`;
const options = { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 };
if (process.env.MONGODB_USER) {
  options.auth = { username: process.env.MONGODB_USER, password: process.env.MONGODB_PASSWORD };
  options.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
}
const client = new MongoClient(uri, options);
const database = client.db(process.env.MONGODB_DATABASE || 'test');
async function connectToMongoDB() {
  await client.connect();
  await database.command({ ping: 1 });
}
module.exports = { client, database, connectToMongoDB };
