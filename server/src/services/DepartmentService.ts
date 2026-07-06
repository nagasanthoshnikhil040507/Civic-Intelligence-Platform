import { BaseService } from './BaseService';
import { DepartmentRepository } from '../database/repositories/DepartmentRepository';
import { IDepartment } from '../database/models/Department';
import { ApiError } from '../utils/ApiError';
import { ClientSession } from 'mongoose';

export class DepartmentService extends BaseService<IDepartment, DepartmentRepository> {
  constructor(repository: DepartmentRepository) {
    super(repository);
  }

  async createDepartment(data: Partial<IDepartment>, session?: ClientSession) {
    const exists = await this.repository.exists({ name: data.name });
    if (exists) throw new ApiError(409, 'Department name already exists');
    return this.create(data, session);
  }

  async updateDepartment(id: string, data: Partial<IDepartment>, session?: ClientSession) {
    return this.update(id, data, session);
  }

  async assignOfficer(departmentId: string, officerId: string, session?: ClientSession) {
    return this.update(departmentId, { $addToSet: { officers: officerId } } as any, session);
  }

  async removeOfficer(departmentId: string, officerId: string, session?: ClientSession) {
    return this.update(departmentId, { $pull: { officers: officerId } } as any, session);
  }

  async updateSLA(departmentId: string, resolutionDays: number, escalationDays: number, session?: ClientSession) {
    if (resolutionDays <= 0 || escalationDays <= 0) throw new ApiError(400, 'SLA days must be positive');
    const dept = await this.repository.updateSLA(departmentId, resolutionDays, escalationDays);
    if (!dept) throw new ApiError(404, 'Department not found');
    return dept;
  }

  async getDepartmentStatistics(departmentId: string) {
    return {
      departmentId,
      message: 'Statistics orchestration pending'
    };
  }
}
