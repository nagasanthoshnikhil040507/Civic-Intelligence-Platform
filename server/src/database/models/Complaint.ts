import { Schema, model, Document, Types } from 'mongoose';

export interface IComplaint extends Document {
  citizenId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  priority: number; // 0-100 score
  severity?: number;
  garbageQuantity?: 1 | 2 | 3; // 1=Small, 2=Medium, 3=Large
  confidenceScore?: number;
  reportCount: number;
  linkedComplaintId?: Types.ObjectId;
  citizenVerification?: 'pending' | 'confirmed' | 'rejected';
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
  address?: string;
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
  aiAnalysis?: {
    garbageDetected?: boolean;
    confidence?: number;
    severity?: string;
    priority?: string;
    quantityEstimation?: string;
    duplicateDetected?: boolean;
    matchedComplaintId?: Types.ObjectId;
    processingStatus?: string;
    analyzedAt?: Date;
    message?: string;
    totalInferenceTimeMs?: number;
    summary?: string;
    duplicateLevel?: 'HIGH' | 'POSSIBLE' | 'NONE';
    locationScore?: number;
    textScore?: number;
    imageScore?: number;
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
    category: { type: String, required: true, default: 'Garbage' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'],
      default: 'pending',
    },
    priority: { type: Number, min: 0, max: 100, default: 50 },
    severity: { type: Number, min: 1, max: 100 },
    garbageQuantity: { type: Number, enum: [1, 2, 3] },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    reportCount: { type: Number, default: 1 },
    linkedComplaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    citizenVerification: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
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
    aiAnalysis: {
      garbageDetected: { type: Boolean },
      confidence: { type: Number },
      severity: { type: String },
      priority: { type: String },
      quantityEstimation: { type: String },
      duplicateDetected: { type: Boolean },
      matchedComplaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
      processingStatus: { type: String },
      analyzedAt: { type: Date },
      message: { type: String },
      totalInferenceTimeMs: { type: Number },
      summary: { type: String },
      duplicateLevel: { type: String, enum: ['HIGH', 'POSSIBLE', 'NONE'] },
      locationScore: { type: Number },
      textScore: { type: Number },
      imageScore: { type: Number }
    },
    tags: [{ type: String }],
    attachments: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// 1. 2dsphere index on location is MANDATORY for geospatial queries (e.g., finding nearby duplicates).
// 2. Index on citizenId allows fast fetching of a user's complaint history.
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ createdAt: -1 });

export const Complaint = model<IComplaint>('Complaint', complaintSchema);
