import { BaseRepository } from './BaseRepository';
import { Department, IDepartment } from '../models/Department';

export class DepartmentRepository extends BaseRepository<IDepartment> {
  constructor() {
    super(Department);
  }

  async findByCategory(category: string) {
    return this.findMany({ categoriesHandled: category, status: 'active', isDeleted: false }, { lean: true });
  }

  async findAvailableOfficers(departmentId: string) {
    const dept = await this.model.findById(departmentId).populate('officers').exec();
    return dept ? dept.officers : [];
  }

  async updateSLA(departmentId: string, resolutionDays: number, escalationDays: number) {
    return this.update(departmentId, {
      $set: {
        'slaSettings.resolutionTimeDays': resolutionDays,
        'slaSettings.escalationTimeDays': escalationDays
      }
    });
  }
}
