import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRepository, ActivityLogRepository } from '../repositories';
import { IUserDocument, AuthTokens, JwtPayload, UserRole } from '../types';
import { AppError } from '../middleware';
import { Request } from 'express';

// ─── Auth Service ─────────────────────────────────────────────────────────────

export class AuthService {
  private userRepo = new UserRepository();
  private logRepo = new ActivityLogRepository();

  generateTokens(user: IUserDocument): AuthTokens {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      userId: user.userId,
      id: user._id.toString(),
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  async login(
    userId: string,
    password: string,
    role: UserRole,
    req: Request
  ): Promise<{ user: IUserDocument; tokens: AuthTokens }> {
    const user = await this.userRepo.findByUserId(userId);

    if (!user) {
      await this.logRepo.create({
        userId: undefined as any,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: { userId, reason: 'User not found' },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated. Contact administrator.', 403);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await this.logRepo.create({
        userId: user._id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: { reason: 'Invalid password' },
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });
      throw new AppError('Invalid credentials', 401);
    }

    if (user.role !== role) {
      throw new AppError(`You do not have ${role} access`, 403);
    }

    const tokens = this.generateTokens(user);
    await this.userRepo.updateLastLogin(user._id.toString());

    await this.logRepo.create({
      userId: user._id,
      action: 'LOGIN',
      resource: 'auth',
      details: { role },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return { user, tokens };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
      const user = await this.userRepo.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      return this.generateTokens(user);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }
}

// ─── User Service ──────────────────────────────────────────────────────────────

export class UserService {
  private userRepo = new UserRepository();
  private logRepo = new ActivityLogRepository();

  async getAllUsers(query: Record<string, unknown>) {
    return this.userRepo.findAll(query as any);
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async createUser(data: Partial<IUserDocument>, createdBy: IUserDocument, req: Request) {
    const existingByUserId = await this.userRepo.findByUserId(data.userId!);
    if (existingByUserId) throw new AppError('User ID already exists', 409);

    const existingByEmail = await this.userRepo.findByEmail(data.email!);
    if (existingByEmail) throw new AppError('Email already registered', 409);

    const user = await this.userRepo.create(data);

    await this.logRepo.create({
      userId: createdBy._id,
      action: 'CREATE_USER',
      resource: 'user',
      resourceId: user._id,
      details: { createdUserId: user.userId, role: user.role },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return user;
  }

  async updateUser(id: string, updates: Partial<IUserDocument>, updatedBy: IUserDocument, req: Request) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);

    const updated = await this.userRepo.update(id, updates);

    await this.logRepo.create({
      userId: updatedBy._id,
      action: 'UPDATE_USER',
      resource: 'user',
      resourceId: user._id,
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return updated;
  }

  async deleteUser(id: string, deletedBy: IUserDocument, req: Request) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (user._id.toString() === deletedBy._id.toString()) {
      throw new AppError('You cannot delete your own account', 400);
    }

    await this.userRepo.delete(id);

    await this.logRepo.create({
      userId: deletedBy._id,
      action: 'DELETE_USER',
      resource: 'user',
      resourceId: user._id,
      details: { deletedUserId: user.userId },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  }

  async getStats() {
    return this.userRepo.getStats();
  }
}
