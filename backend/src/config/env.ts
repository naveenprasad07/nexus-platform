import dotenv from 'dotenv';


dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  API_MIN_DELAY: number;
  API_MAX_DELAY: number;
}

const validateEnv = (): EnvConfig => {
  return {
    NODE_ENV: process.env['NODE_ENV'] || 'development',
    PORT: parseInt(process.env['PORT'] || '5000', 10),
    MONGO_URI: process.env['MONGO_URI'] || 'mongodb://localhost:27017/nexus_platform',
    JWT_SECRET: process.env['JWT_SECRET'] || 'dev_jwt_secret_change_in_production_32chars!!',
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '7d',
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'dev_refresh_secret_change_in_prod!!',
    JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] || '30d',
    CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10),
    RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
    API_MIN_DELAY: parseInt(process.env['API_MIN_DELAY'] || '0', 10),
    API_MAX_DELAY: parseInt(process.env['API_MAX_DELAY'] || '0', 10),
  };
};

export const env = validateEnv();