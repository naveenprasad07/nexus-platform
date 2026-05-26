import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { JwtPayload, AuthRequest } from '../types';
import { ApiResponseHelper } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// ─── Auth Middleware ────────────────────────────────────────────────────────────

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      ApiResponseHelper.unauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await User.findById(decoded.id).select('+password');
    if (!user || !user.isActive) {
      ApiResponseHelper.unauthorized(res, 'User not found or account deactivated');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ApiResponseHelper.unauthorized(res, 'Token expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      ApiResponseHelper.unauthorized(res, 'Invalid token');
      return;
    }
    ApiResponseHelper.error(res, 'Authentication failed');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponseHelper.unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      ApiResponseHelper.forbidden(res, `Role '${req.user.role}' is not authorized for this route`);
      return;
    }
    next();
  };
};

// ─── API Delay Simulation Middleware ──────────────────────────────────────────

export const simulateDelay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const customDelay = req.headers['x-simulate-delay'];
  const minDelay = env.API_MIN_DELAY;
  const maxDelay = env.API_MAX_DELAY;

  let delay = 0;

  if (customDelay && !isNaN(Number(customDelay))) {
    delay = Math.min(Number(customDelay), 10000); // cap at 10s
  } else if (maxDelay > 0) {
    delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  if (delay > 0) {
    logger.debug(`Simulating API delay: ${delay}ms for ${req.method} ${req.path}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  next();
};

// ─── Error Handling Middleware ────────────────────────────────────────────────

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`, {
    url: req.url,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    ApiResponseHelper.error(res, err.message, err.statusCode);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values((err as any).errors).map((e: any) => e.message);
    ApiResponseHelper.badRequest(res, 'Validation failed', messages.join(', '));
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    ApiResponseHelper.badRequest(res, `${field} already exists`);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    ApiResponseHelper.unauthorized(res, 'Invalid token');
    return;
  }

  ApiResponseHelper.error(res, 'Internal server error');
};

// ─── Not Found Middleware ──────────────────────────────────────────────────────

export const notFound = (req: Request, res: Response): void => {
  ApiResponseHelper.notFound(res, `Route ${req.originalUrl} not found`);
};

// ─── Request Logging Middleware ────────────────────────────────────────────────

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
};
