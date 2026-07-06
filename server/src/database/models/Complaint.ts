import { Schema, model, Document, Types } from 'mongoose';

export interface IComplaint extends Document {
  citizenId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity?: number;
  aiInsightId?: Types.ObjectId;
  images: Array<{
    publicId: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
    uploadedAt: Date;
  }>;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  timeline: Array<{
    status: string;
    updatedBy: Types.ObjectId;
    timestamp: Date;
    note?: string;
  }>;
  assignmentHistory: Array<{
    officerId: Types.ObjectId;
    assignedAt: Date;
  }>;
  resolutionDetails?: {
    resolvedAt: Date;
    resolvedBy: Types.ObjectId;
    proofImages: string[];
    resolutionNote: string;
  };
  tags: string[];
  attachments: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    severity: { type: Number, min: 1, max: 100 },
    aiInsightId: { type: Schema.Types.ObjectId, ref: 'AIInsight' },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    address: { type: String },
    images: [
      {
        publicId: { type: String, required: true },
        url: { type: String, required: true },
        width: { type: Number },
        height: { type: Number },
        format: { type: String },
        bytes: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        status: { type: String, required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
    assignmentHistory: [
      {
        officerId: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    resolutionDetails: {
      resolvedAt: { type: Date },
      resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      proofImages: [{ type: String }],
      resolutionNote: { type: String },
    },
    tags: [{ type: String }],
    attachments: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// Explanation:
// 1. 2dsphere index on location is MANDATORY for geospatial queries (e.g., finding nearby duplicates).
// 2. Compound index on (status, departmentId) optimizes the most common query: fetching active complaints for a specific department.
// 3. Index on citizenId allows fast fetching of a user's complaint history.
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1, departmentId: 1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ createdAt: -1 });

export const Complaint = model<IComplaint>('Complaint', complaintSchema);
