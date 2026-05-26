import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ApiResponseHelper } from '../utils/apiResponse';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    ApiResponseHelper.badRequest(res, 'Validation failed', messages);
    return;
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const loginValidators = [
  body('userId').trim().notEmpty().withMessage('User ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user'),
];

export const registerValidators = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID is required')
    .isLength({ min: 3, max: 30 }).withMessage('User ID must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('User ID can only contain letters, numbers, underscores, dots, hyphens'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('role').optional().isIn(['admin', 'user']).withMessage('Invalid role'),
  body('department').trim().notEmpty().withMessage('Department is required'),
];

// ─── Record Validators ────────────────────────────────────────────────────────

export const createRecordValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('status').optional().isIn(['active', 'pending', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('assignedTo').notEmpty().withMessage('Assigned user is required').isMongoId(),
  body('metadata.category').isIn(['development', 'design', 'research', 'testing', 'deployment', 'maintenance', 'documentation']).withMessage('Invalid category'),
  body('metadata.estimatedHours').optional().isNumeric().isFloat({ min: 0 }),
];

export const updateRecordValidators = [
  param('id').isMongoId().withMessage('Invalid record ID'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('status').optional().isIn(['active', 'pending', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
];

// ─── User Management Validators ───────────────────────────────────────────────

export const updateUserValidators = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('role').optional().isIn(['admin', 'user']),
  body('department').optional().trim().notEmpty(),
  body('isActive').optional().isBoolean(),
];

// ─── Pagination Validators ────────────────────────────────────────────────────

export const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('order').optional().isIn(['asc', 'desc']),
];
