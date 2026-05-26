import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000;

export const connectDatabase = async (): Promise<void> => {
  let retries = 0;

  const connect = async (): Promise<void> => {
    try {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nexus_platform';

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('✅ MongoDB connected successfully');

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(connect, RETRY_INTERVAL);
      });

    } catch (error) {
      retries += 1;
      logger.error(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}):`, error);

      if (retries < MAX_RETRIES) {
        logger.info(`Retrying in ${RETRY_INTERVAL / 1000}s...`);
        setTimeout(connect, RETRY_INTERVAL);
      } else {
        logger.error('Max retries reached. Exiting...');
        process.exit(1);
      }
    }
  };

  await connect();
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
