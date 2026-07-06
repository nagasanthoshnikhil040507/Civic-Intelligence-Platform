import { BaseService } from './BaseService';
import { AuditLogRepository } from '../database/repositories/AuditLogRepository';
import { IAuditLog } from '../database/models/AuditLog';

export class AuditLogService extends BaseService<IAuditLog, AuditLogRepository> {
  constructor(repository: AuditLogRepository) {
    super(repository);
  }

  async recordAction(data: Partial<IAuditLog>) {
    try {
      return await this.create(data);
    } catch (error) {
      console.error('Failed to write audit log', error);
      return null;
    }
  }

  async recordEntityChange(entityModel: string, entityId: string, action: string, changes: any[], userId?: string, ipAddress?: string, userAgent?: string) {
    return this.recordAction({
      entityModel,
      entityId: entityId as any,
      action,
      changes,
      userId: userId as any,
      ipAddress,
      userAgent
    });
  }

  async getEntityHistory(entityModel: string, entityId: string) {
    return this.repository.entityHistory(entityModel, entityId);
  }

  async getUserActivity(userId: string) {
    return this.repository.userActivity(userId);
  }
}
