import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'officer' | 'admin';
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  loginHistory: Array<{
    ip: string;
    device: string;
    timestamp: Date;
  }>;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'officer', 'admin'], default: 'citizen' },
    avatar: { type: String },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    preferences: {
      language: { type: String, default: 'en' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    loginHistory: [
      {
        ip: { type: String },
        device: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    emailVerified: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
// Explanation: Index on role helps in filtering users by role for admin dashboards.
// Index on isDeleted ensures queries filtering out soft-deleted users are fast.
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });

export const User = model<IUser>('User', userSchema);
