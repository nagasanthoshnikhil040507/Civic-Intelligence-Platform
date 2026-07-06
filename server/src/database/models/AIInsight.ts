import { Schema, model, Document, Types } from 'mongoose';

export interface IAIInsight extends Document {
  complaintId: Types.ObjectId;
  classification: {
    predictedCategory: string;
    confidence: number;
  };
  duplicateInformation: {
    isDuplicate: boolean;
    duplicateReferenceId?: Types.ObjectId;
    similarityScore?: number;
  };
  severityPrediction: {
    score: number;
    factors: string[];
  };
  priorityPrediction: string;
  departmentRecommendation: Types.ObjectId;
  processingTimeMs: number;
  modelVersions: {
    visionModel: string;
    nlpModel: string;
    routingModel: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const aiInsightSchema = new Schema<IAIInsight>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
    classification: {
      predictedCategory: { type: String, required: true },
      confidence: { type: Number, required: true },
    },
    duplicateInformation: {
      isDuplicate: { type: Boolean, default: false },
      duplicateReferenceId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
      similarityScore: { type: Number },
    },
    severityPrediction: {
      score: { type: Number, required: true },
      factors: [{ type: String }],
    },
    priorityPrediction: { type: String, required: true },
    departmentRecommendation: { type: Schema.Types.ObjectId, ref: 'Department' },
    processingTimeMs: { type: Number, required: true },
    modelVersions: {
      visionModel: { type: String, required: true },
      nlpModel: { type: String, required: true },
      routingModel: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Indexes
// Explanation:
// complaintId must be unique. 1-to-1 relationship with Complaint.
// We index departmentRecommendation to analyze how often AI routes to specific departments.
// Note: complaintId index is automatically created by unique: true
aiInsightSchema.index({ departmentRecommendation: 1 });

export const AIInsight = model<IAIInsight>('AIInsight', aiInsightSchema);
