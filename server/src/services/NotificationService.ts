import { BaseService } from './BaseService';
import { NotificationRepository } from '../database/repositories/NotificationRepository';
import { INotification } from '../database/models/Notification';
import { ClientSession } from 'mongoose';

export class NotificationService extends BaseService<INotification, NotificationRepository> {
  constructor(repository: NotificationRepository) {
    super(repository);
  }

  async createNotification(data: Partial<INotification>, session?: ClientSession) {
    return this.create(data, session);
  }

  async sendInAppNotification(data: Partial<INotification>, session?: ClientSession) {
    return this.create(data, session);
  }

  async markAsRead(notificationId: string, session?: ClientSession) {
    return this.update(notificationId, { $set: { isRead: true, readAt: new Date() } } as any, session);
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllRead(userId);
  }

  async deleteNotification(notificationId: string, session?: ClientSession) {
    return this.delete(notificationId, true, session);
  }
}
