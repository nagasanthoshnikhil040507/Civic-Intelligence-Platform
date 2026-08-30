import { Notification, INotification } from '../database/models/Notification';
import { Types } from 'mongoose';

export class NotificationService {
  static async notifyAdmin(data: {
    type: string;
    title: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    complaintId?: Types.ObjectId | string;
    transferRequestId?: Types.ObjectId | string;
    senderId?: Types.ObjectId | string;
    senderRole?: 'admin' | 'officer' | 'citizen' | 'system';
    metadata?: any;
  }) {
    return Notification.create({
      recipientRole: 'admin',
      ...data
    });
  }

  static async notifyOfficer(
    officerId: Types.ObjectId | string,
    data: {
      type: string;
      title: string;
      message: string;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      complaintId?: Types.ObjectId | string;
      transferRequestId?: Types.ObjectId | string;
      senderId?: Types.ObjectId | string;
      senderRole?: 'admin' | 'officer' | 'citizen' | 'system';
      metadata?: any;
    }
  ) {
    return Notification.create({
      recipientId: officerId,
      recipientRole: 'officer',
      ...data
    });
  }

  static async getUserNotifications(userId: string | Types.ObjectId, role: string, limit: number = 20) {
    return Notification.find({
      $or: [
        { recipientId: userId },
        { recipientRole: role, recipientId: { $exists: false } },
        { recipientRole: role, recipientId: null },
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getUnreadCount(userId: string | Types.ObjectId, role: string) {
    return Notification.countDocuments({
      $or: [
        { recipientId: userId },
        { recipientRole: role, recipientId: { $exists: false } },
        { recipientRole: role, recipientId: null },
      ],
      isRead: false
    });
  }

  static async markAsRead(notificationId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId }, // Ideally also verify ownership
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string | Types.ObjectId, role: string) {
    return Notification.updateMany(
      {
        $or: [
          { recipientId: userId },
          { recipientRole: role, recipientId: { $exists: false } },
          { recipientRole: role, recipientId: null },
        ],
        isRead: false
      },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }
}
