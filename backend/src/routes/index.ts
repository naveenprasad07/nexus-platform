import { Router } from 'express';
import { authenticate, authorize } from '../middleware';
import { simulateDelay } from '../middleware';
import { validate } from '../middleware/validators';
import {
  loginValidators, registerValidators,
  paginationValidators, updateUserValidators,
  createRecordValidators, updateRecordValidators,
} from '../middleware/validators';
import * as ctrl from '../controllers';

// ─── Auth Routes ──────────────────────────────────────────────────────────────

export const authRouter = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, password, role]
 *             properties:
 *               userId: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, user] }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', loginValidators, validate, ctrl.login);
authRouter.post('/refresh', ctrl.refreshToken);
authRouter.get('/me', authenticate, ctrl.getMe);
authRouter.post('/logout', authenticate, ctrl.logout);

// ─── User Routes ──────────────────────────────────────────────────────────────

export const userRouter = Router();

userRouter.use(authenticate, simulateDelay);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
userRouter.get('/', authorize('admin'), paginationValidators, validate, ctrl.getUsers);
userRouter.get('/stats', authorize('admin'), ctrl.getUserStats);
userRouter.get('/:id', authorize('admin'), ctrl.getUserById);
userRouter.post('/', authorize('admin'), registerValidators, validate, ctrl.createUser);
userRouter.put('/:id', authorize('admin'), updateUserValidators, validate, ctrl.updateUser);
userRouter.delete('/:id', authorize('admin'), ctrl.deleteUser);

// ─── Record Routes ────────────────────────────────────────────────────────────

export const recordRouter = Router();

recordRouter.use(authenticate, simulateDelay);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get records (own for user, all for admin)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 */
recordRouter.get('/', paginationValidators, validate, ctrl.getRecords);
recordRouter.get('/:id', ctrl.getRecordById);
recordRouter.post('/', authorize('admin'), createRecordValidators, validate, ctrl.createRecord);
recordRouter.put('/:id', updateRecordValidators, validate, ctrl.updateRecord);
recordRouter.delete('/:id', authorize('admin'), ctrl.deleteRecord);

// ─── Dashboard Routes ──────────────────────────────────────────────────────────

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, simulateDelay);

dashboardRouter.get('/analytics', ctrl.getDashboardAnalytics);
dashboardRouter.get('/activity', authorize('admin'), ctrl.getActivityLogs);
