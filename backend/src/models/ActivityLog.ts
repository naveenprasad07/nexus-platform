import mongoose, { Schema } from 'mongoose';
import { IActivityLogDocument } from '../types';

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
        'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
        'CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD',
        'VIEW_DASHBOARD', 'EXPORT_DATA', 'CHANGE_PASSWORD',
      ],
    },
    resource: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);
