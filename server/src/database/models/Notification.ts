import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'status_update' | 'assignment' | 'system_alert' | 'resolution';
  relatedEntity: {
    entityModel: 'Complaint' | 'Department' | 'User';
    entityId: Types.ObjectId;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  deliveryStatus: {
    emailSent: boolean;
    smsSent: boolean;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['status_update', 'assignment', 'system_alert', 'resolution'],
      required: true,
    },
    relatedEntity: {
      entityModel: { type: String, enum: ['Complaint', 'Department', 'User'], required: true },
      entityId: { type: Schema.Types.ObjectId, required: true },
    },
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
    deliveryStatus: {
      emailSent: { type: Boolean, default: false },
      smsSent: { type: Boolean, default: false },
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes
// Explanation:
// Compound index on (userId, isRead) to quickly fetch unread notifications for the user's bell icon.
// Index on createdAt to easily clear old notifications (TTL could also be added here).
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
