import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import { authRouter, userRouter, recordRouter, dashboardRouter } from './routes';
import { errorHandler, notFound, requestLogger } from './middleware';
import { logger } from './utils/logger';

const app = express();
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-simulate-delay'],
  credentials: true,
}));

app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Parsing & Utilities ──────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(compression());
app.use(requestLogger);

// ─── API Routes ───────────────────────────────────────────────────────────────

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/records`, recordRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

// ─── Swagger Docs ──────────────────────────────────────────────────────────────

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nexus Platform API',
}));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────

const startServer = async () => {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Nexus Platform API running on port ${env.PORT}`);
    logger.info(`📖 Swagger docs: http://localhost:${env.PORT}/api/docs`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Received shutdown signal...');
    server.close(async () => {
      const { disconnectDatabase } = await import('./config/database');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
};

startServer();

export default app;
