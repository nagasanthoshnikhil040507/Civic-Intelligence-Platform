import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITransferRequest extends Document {
  complaintId: Types.ObjectId;
  requestedByOfficerId: Types.ObjectId;
  department: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminDecisionNote?: string;
  reviewedByAdminId?: Types.ObjectId;
  reviewedAt?: Date;
  targetOfficerId?: Types.ObjectId;
  transferredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transferRequestSchema = new Schema<ITransferRequest>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true },
    requestedByOfficerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    adminDecisionNote: { type: String },
    reviewedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    targetOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
    transferredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
transferRequestSchema.index({ status: 1 });
transferRequestSchema.index({ complaintId: 1 });
transferRequestSchema.index({ requestedByOfficerId: 1 });

export const TransferRequest = mongoose.model<ITransferRequest>('TransferRequest', transferRequestSchema);
