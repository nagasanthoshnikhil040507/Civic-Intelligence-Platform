import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipientId?: Types.ObjectId; // null for generic admin broadcasts
  recipientRole: 'admin' | 'officer' | 'citizen' | 'all';
  senderId?: Types.ObjectId;
  senderRole?: 'admin' | 'officer' | 'citizen' | 'system';
  
  type: string;
  title: string;
  message: string;
  
  complaintId?: Types.ObjectId;
  transferRequestId?: Types.ObjectId;
  
  isRead: boolean;
  readAt?: Date;
  
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    recipientRole: { type: String, enum: ['admin', 'officer', 'citizen', 'all'], required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['admin', 'officer', 'citizen', 'system'] },
    
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    complaintId: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    transferRequestId: { type: Schema.Types.ObjectId, ref: 'TransferRequest' },
    
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
    
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
