import mongoose from 'mongoose';
import { Config } from '../config';

export async function connectDb(config: Config): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, {
      dbName: config.mongodbDb,
    });
    console.log(`Connected to MongoDB: ${config.mongodbDb}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}
