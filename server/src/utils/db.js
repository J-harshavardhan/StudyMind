import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from '../config/env.js';

let memoryServer;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = env.USE_MEMORY_DB
    ? (memoryServer ??= await MongoMemoryServer.create()).getUri()
    : env.MONGO_URI;

  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function closeDb() {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }

  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
}
