import mongoose, { ConnectOptions } from 'mongoose';
import { MONGOURI } from './env.config';
import { msg } from '../constant';

const mongooseOptions: ConnectOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  autoIndex: true,
};

// Database connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  console.log(`${msg.dbMsg.dbSuccess}`);
});

mongoose.connection.on('error', (err: Error) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

export const dbConnect = async (retries = 5, delayMs = 2000): Promise<typeof mongoose> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connect = await mongoose.connect(MONGOURI, mongooseOptions);
      return connect;
    } catch (err) {
      const error = err as Error;
      console.error(`${msg.dbMsg.dbFailed} (Attempt ${attempt}/${retries}): ${error.message}`);
      if (attempt === retries) {
        process.exit(1);
      }
      console.log(`Retrying MongoDB connection in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Failed to connect to MongoDB');
};

export const dbDisconnect = async (): Promise<void> => {
  try {
    await mongoose.connection.close(false);
    console.log('MongoDB connection cleanly closed.');
  } catch (err) {
    const error = err as Error;
    console.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

export default {
  dbConnect,
  dbDisconnect,
};
