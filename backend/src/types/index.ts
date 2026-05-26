import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── User Types ────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';

export interface IUser {
  _id: Types.ObjectId;
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserDocument extends IUser, Document {}

// ─── Record Types ─────────────────────────────────────────────────────────────

export type RecordStatus = 'active' | 'pending' | 'completed' | 'cancelled';
export type RecordPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IRecord {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: RecordStatus;
  priority: RecordPriority;
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  tags: string[];
  dueDate?: Date;
  completedAt?: Date;
  metadata: {
    estimatedHours: number;
    actualHours?: number;
    category: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecordDocument extends IRecord, Document {}

// ─── Activity Log Types ───────────────────────────────────────────────────────

export interface IActivityLog {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: Types.ObjectId;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface IActivityLogDocument extends IActivityLog, Document {}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Request Types ─────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: string;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  priority?: string;
}

// ─── Dashboard Analytics ──────────────────────────────────────────────────────

export interface DashboardAnalytics {
  totalRecords: number;
  activeRecords: number;
  pendingRecords: number;
  completedRecords: number;
  cancelledRecords: number;
  totalUsers: number;
  activeUsers: number;
  recentActivity: IActivityLog[];
  recordsByPriority: { _id: string; count: number }[];
  recordsByStatus: { _id: string; count: number }[];
  recordsThisWeek: number;
  completionRate: number;
}
