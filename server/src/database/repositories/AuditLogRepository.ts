import { BaseRepository } from './BaseRepository';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export class AuditLogRepository extends BaseRepository<IAuditLog> {
  constructor() {
    super(AuditLog);
  }

  async entityHistory(entityModel: string, entityId: string) {
    return this.findMany({ entityModel, entityId }, { sort: { createdAt: -1 }, lean: true });
  }

  async userActivity(userId: string, limit: number = 50) {
    return this.findMany({ userId }, { sort: { createdAt: -1 }, limit, lean: true });
  }
}
