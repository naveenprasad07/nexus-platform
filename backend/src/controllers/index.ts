import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/auth.service';
import { RecordService, DashboardService } from '../services/record.service';
import { ActivityLogRepository } from '../repositories';
import { ApiResponseHelper } from '../utils/apiResponse';

const authService = new AuthService();
const userService = new UserService();
const recordService = new RecordService();
const dashboardService = new DashboardService();
const logRepo = new ActivityLogRepository();

// ─── Auth Controller ──────────────────────────────────────────────────────────

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, password, role } = req.body;
    const { user, tokens } = await authService.login(userId, password, role, req);
    ApiResponseHelper.success(res, { user, tokens }, 'Login successful');
  } catch (err) { next(err); }
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { ApiResponseHelper.badRequest(res, 'Refresh token required'); return; }
    const tokens = await authService.refreshToken(refreshToken);
    ApiResponseHelper.success(res, { tokens }, 'Token refreshed');
  } catch (err) { next(err); }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    ApiResponseHelper.success(res, { user: req.user }, 'Profile retrieved');
  } catch (err) { next(err); }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await logRepo.create({
        userId: req.user._id,
        action: 'LOGOUT',
        resource: 'auth',
        details: {},
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      });
    }
    ApiResponseHelper.success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

// ─── User Controller ──────────────────────────────────────────────────────────

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, meta } = await userService.getAllUsers(req.query);
    ApiResponseHelper.paginated(res, data, meta, 'Users retrieved');
  } catch (err) { next(err); }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    ApiResponseHelper.success(res, { user });
  } catch (err) { next(err); }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.createUser(req.body, req.user!, req);
    ApiResponseHelper.created(res, { user }, 'User created successfully');
  } catch (err) { next(err); }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user!, req);
    ApiResponseHelper.success(res, { user }, 'User updated successfully');
  } catch (err) { next(err); }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.deleteUser(req.params.id, req.user!, req);
    ApiResponseHelper.success(res, null, 'User deleted successfully');
  } catch (err) { next(err); }
};

export const getUserStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await userService.getStats();
    ApiResponseHelper.success(res, stats);
  } catch (err) { next(err); }
};

// ─── Record Controller ────────────────────────────────────────────────────────

export const getRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, meta } = await recordService.getRecords(req.query as any, req.user!);
    ApiResponseHelper.paginated(res, data, meta, 'Records retrieved');
  } catch (err) { next(err); }
};

export const getRecordById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await recordService.getRecordById(req.params.id, req.user!);
    ApiResponseHelper.success(res, { record });
  } catch (err) { next(err); }
};

export const createRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await recordService.createRecord(req.body, req.user!, req);
    ApiResponseHelper.created(res, { record }, 'Record created successfully');
  } catch (err) { next(err); }
};

export const updateRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body, req.user!, req);
    ApiResponseHelper.success(res, { record }, 'Record updated');
  } catch (err) { next(err); }
};

export const deleteRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await recordService.deleteRecord(req.params.id, req.user!, req);
    ApiResponseHelper.success(res, null, 'Record deleted');
  } catch (err) { next(err); }
};

// ─── Dashboard Controller ──────────────────────────────────────────────────────

export const getDashboardAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const analytics = await dashboardService.getAnalytics(req.user!);
    ApiResponseHelper.success(res, analytics, 'Analytics retrieved');
  } catch (err) { next(err); }
};

export const getActivityLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await logRepo.findRecent(50);
    ApiResponseHelper.success(res, logs);
  } catch (err) { next(err); }
};
