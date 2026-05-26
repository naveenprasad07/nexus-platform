import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { User } from '../models/User';
import { Record } from '../models/Record';
import { ActivityLog } from '../models/ActivityLog';
import {
  IUserDocument,
  IRecordDocument,
  IActivityLogDocument,
  PaginationQuery,
  PaginationMeta,
} from '../types';
import { buildPaginationMeta } from '../utils/apiResponse';

// ─── User Repository ──────────────────────────────────────────────────────────

export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  }

  async findByUserId(userId: string): Promise<IUserDocument | null> {
    return User.findOne({ userId }).select('+password');
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email });
  }

  async findAll(
    query: PaginationQuery,
    filter: FilterQuery<IUserDocument> = {}
  ): Promise<{ data: IUserDocument[]; meta: PaginationMeta }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 10);
    const skip = (page - 1) * limit;
    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { userId: { $regex: query.search, $options: 'i' } },
        { department: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async create(userData: Partial<IUserDocument>): Promise<IUserDocument> {
    const user = new User(userData);
    return user.save();
  }

  async update(id: string, updates: UpdateQuery<IUserDocument>): Promise<IUserDocument | null> {
    return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IUserDocument | null> {
    return User.findByIdAndDelete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async countByRole(role: string): Promise<number> {
    return User.countDocuments({ role });
  }

  async getStats(): Promise<{ total: number; active: number; admins: number }> {
    const [total, active, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
    ]);
    return { total, active, admins };
  }
}

// ─── Record Repository ────────────────────────────────────────────────────────

export class RecordRepository {
  async findById(id: string): Promise<IRecordDocument | null> {
    return Record.findById(id)
      .populate('assignedTo', 'firstName lastName userId email')
      .populate('createdBy', 'firstName lastName userId');
  }

  async findAll(
    query: PaginationQuery,
    filter: FilterQuery<IRecordDocument> = {}
  ): Promise<{ data: IRecordDocument[]; meta: PaginationMeta }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, query.limit || 10);
    const skip = (page - 1) * limit;
    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    const [data, total] = await Promise.all([
      Record.find(filter)
        .populate('assignedTo', 'firstName lastName userId email department')
        .populate('createdBy', 'firstName lastName userId')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Record.countDocuments(filter),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findByUser(
    userId: Types.ObjectId,
    query: PaginationQuery
  ): Promise<{ data: IRecordDocument[]; meta: PaginationMeta }> {
    return this.findAll(query, { assignedTo: userId });
  }

  async create(data: Partial<IRecordDocument>): Promise<IRecordDocument> {
    const record = new Record(data);
    return record.save();
  }

  async update(id: string, updates: UpdateQuery<IRecordDocument>): Promise<IRecordDocument | null> {
    return Record.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('assignedTo', 'firstName lastName userId email')
      .populate('createdBy', 'firstName lastName userId');
  }

  async delete(id: string): Promise<IRecordDocument | null> {
    return Record.findByIdAndDelete(id);
  }

  async getAnalytics(): Promise<{
    byStatus: { _id: string; count: number }[];
    byPriority: { _id: string; count: number }[];
    thisWeek: number;
    completionRate: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [byStatus, byPriority, thisWeek, total, completed] = await Promise.all([
      Record.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Record.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Record.countDocuments({ createdAt: { $gte: weekAgo } }),
      Record.countDocuments(),
      Record.countDocuments({ status: 'completed' }),
    ]);

    return {
      byStatus,
      byPriority,
      thisWeek,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}

// ─── Activity Log Repository ──────────────────────────────────────────────────

export class ActivityLogRepository {
  async create(data: Partial<IActivityLogDocument>): Promise<IActivityLogDocument> {
    const log = new ActivityLog(data);
    return log.save();
  }

  async findByUser(userId: string, limit = 20): Promise<IActivityLogDocument[]> {
    return ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName userId');
  }

  async findRecent(limit = 50): Promise<IActivityLogDocument[]> {
    return ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName userId role');
  }
}
