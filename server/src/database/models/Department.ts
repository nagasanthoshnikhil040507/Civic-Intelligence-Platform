import { Schema, model, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  jurisdiction: string;
  categoriesHandled: string[];
  officers: Types.ObjectId[];
  contactDetails: {
    email: string;
    phone: string;
  };
  slaSettings: {
    resolutionTimeDays: number;
    escalationTimeDays: number;
  };
  status: 'active' | 'inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    jurisdiction: { type: String, required: true },
    categoriesHandled: [{ type: String }],
    officers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    contactDetails: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    slaSettings: {
      resolutionTimeDays: { type: Number, default: 7 },
      escalationTimeDays: { type: Number, default: 3 },
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// Explanation: Index on categoriesHandled helps AI routing quickly find the department handling a specific issue.
// Note: name index is automatically created by unique: true
departmentSchema.index({ categoriesHandled: 1 });
departmentSchema.index({ isDeleted: 1 });

export const Department = model<IDepartment>('Department', departmentSchema);
