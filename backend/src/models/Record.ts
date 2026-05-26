import mongoose, { Schema } from 'mongoose';
import { IRecordDocument } from '../types';

const RecordSchema = new Schema<IRecordDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{ type: String, trim: true }],
    dueDate: { type: Date },
    completedAt: { type: Date },
    metadata: {
      estimatedHours: { type: Number, default: 0, min: 0 },
      actualHours: { type: Number, min: 0 },
      category: {
        type: String,
        required: true,
        enum: ['development', 'design', 'research', 'testing', 'deployment', 'maintenance', 'documentation'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
  delete ret['__v'];
  return ret;
},

    },
  }
);

// Indexes for performance
RecordSchema.index({ assignedTo: 1, status: 1 });
RecordSchema.index({ createdBy: 1 });
RecordSchema.index({ status: 1, priority: 1 });
RecordSchema.index({ createdAt: -1 });
RecordSchema.index({ title: 'text', description: 'text' });

// Pre-save: set completedAt when status becomes completed
RecordSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export const Record = mongoose.model<IRecordDocument>('Record', RecordSchema);
