import { Types } from 'mongoose';
import { RecordRepository, ActivityLogRepository, UserRepository } from '../repositories';
import { IUserDocument, IRecordDocument, PaginationQuery, DashboardAnalytics } from '../types';
import { AppError } from '../middleware';
import { Request } from 'express';

// ─── Record Service ────────────────────────────────────────────────────────────

export class RecordService {
  private recordRepo = new RecordRepository();
  private logRepo = new ActivityLogRepository();

  async getRecords(query: PaginationQuery, user: IUserDocument) {
    const filter = user.role === 'admin' ? {} : { assignedTo: user._id };
    return this.recordRepo.findAll(query, filter);
  }

  async getRecordById(id: string, user: IUserDocument) {
    const record = await this.recordRepo.findById(id);
    if (!record) throw new AppError('Record not found', 404);

    if (
      user.role !== 'admin' &&
      record.assignedTo._id?.toString() !== user._id.toString()
    ) {
      throw new AppError('Access denied to this record', 403);
    }

    return record;
  }

  async createRecord(data: Partial<IRecordDocument>, createdBy: IUserDocument, req: Request) {
    const record = await this.recordRepo.create({
      ...data,
      createdBy: createdBy._id,
    });

    await this.logRepo.create({
      userId: createdBy._id,
      action: 'CREATE_RECORD',
      resource: 'record',
      resourceId: record._id,
      details: { title: record.title, priority: record.priority },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return record;
  }

  async updateRecord(
    id: string,
    updates: Partial<IRecordDocument>,
    user: IUserDocument,
    req: Request
  ) {
    const record = await this.recordRepo.findById(id);
    if (!record) throw new AppError('Record not found', 404);

    if (
      user.role !== 'admin' &&
      record.assignedTo._id?.toString() !== user._id.toString()
    ) {
      throw new AppError('Access denied', 403);
    }

    const updated = await this.recordRepo.update(id, updates);

    await this.logRepo.create({
      userId: user._id,
      action: 'UPDATE_RECORD',
      resource: 'record',
      resourceId: record._id,
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    return updated;
  }

  async deleteRecord(id: string, user: IUserDocument, req: Request) {
    const record = await this.recordRepo.findById(id);
    if (!record) throw new AppError('Record not found', 404);

    if (user.role !== 'admin') {
      throw new AppError('Only admins can delete records', 403);
    }

    await this.recordRepo.delete(id);

    await this.logRepo.create({
      userId: user._id,
      action: 'DELETE_RECORD',
      resource: 'record',
      resourceId: record._id,
      details: { title: record.title },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  }

  async getAnalytics() {
    return this.recordRepo.getAnalytics();
  }
}

// ─── Dashboard Service ────────────────────────────────────────────────────────

export class DashboardService {
  private recordRepo = new RecordRepository();
  private userRepo = new UserRepository();
  private logRepo = new ActivityLogRepository();

  async getAnalytics(user: IUserDocument): Promise<DashboardAnalytics> {
    const recordFilter =
      user.role === 'admin' ? {} : { assignedTo: user._id };

    const [recordStats, userStats, recentActivity, analytics] = await Promise.all([
      this.recordRepo.findAll({ limit: 1 }, recordFilter),
      user.role === 'admin' ? this.userRepo.getStats() : Promise.resolve({ total: 0, active: 0, admins: 0 }),
      this.logRepo.findRecent(user.role === 'admin' ? 20 : 10),
      this.recordRepo.getAnalytics(),
    ]);

    const statusMap: Record<string, number> = {};
    analytics.byStatus.forEach(({ _id, count }) => (statusMap[_id] = count));

    return {
      totalRecords: recordStats.meta.total,
      activeRecords: statusMap['active'] || 0,
      pendingRecords: statusMap['pending'] || 0,
      completedRecords: statusMap['completed'] || 0,
      cancelledRecords: statusMap['cancelled'] || 0,
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      recentActivity,
      recordsByPriority: analytics.byPriority,
      recordsByStatus: analytics.byStatus,
      recordsThisWeek: analytics.thisWeek,
      completionRate: analytics.completionRate,
    };
  }
}
