import { BaseService } from './BaseService';
import { UserRepository } from '../database/repositories/UserRepository';
import { IUser } from '../database/models/User';
import { ApiError } from '../utils/ApiError';
import { ClientSession } from 'mongoose';

export class UserService extends BaseService<IUser, UserRepository> {
  constructor(repository: UserRepository) {
    super(repository);
  }

  async createUser(data: Partial<IUser>, session?: ClientSession) {
    const exists = await this.repository.exists({ email: data.email });
    if (exists) throw new ApiError(409, 'User with this email already exists');
    return this.repository.create(data, session);
  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async updateProfile(id: string, data: Partial<IUser>, session?: ClientSession) {
    return this.update(id, data, session);
  }

  async deactivateUser(id: string, session?: ClientSession) {
    return this.update(id, { $set: { status: 'inactive' } } as any, session);
  }

  async activateUser(id: string, session?: ClientSession) {
    return this.update(id, { $set: { status: 'active' } } as any, session);
  }

  async changePreferences(id: string, preferences: any, session?: ClientSession) {
    return this.update(id, { $set: { preferences } } as any, session);
  }

  async updateNotificationSettings(id: string, settings: any, session?: ClientSession) {
    return this.update(id, { $set: { notificationSettings: settings } } as any, session);
  }

  async recordLogin(userId: string, ip: string, device: string) {
    return this.repository.updateLastLogin(userId, ip, device);
  }
}
