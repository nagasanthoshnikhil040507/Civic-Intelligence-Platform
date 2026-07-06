import { BaseRepository } from './BaseRepository';
import { Notification, INotification } from '../models/Notification';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  async unreadNotifications(userId: string) {
    return this.findMany({ userId, isRead: false }, { sort: { createdAt: -1 }, lean: true });
  }

  async markAllRead(userId: string) {
    return this.updateMany({ userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  }

  async notificationsByUser(userId: string, limit: number = 20) {
    return this.findMany({ userId }, { sort: { createdAt: -1 }, limit, lean: true });
  }
}
