import { BaseRepository } from './BaseRepository';
import { Complaint, IComplaint } from '../models/Complaint';

export class ComplaintRepository extends BaseRepository<IComplaint> {
  constructor() {
    super(Complaint);
  }

  async findNearbyComplaints(longitude: number, latitude: number, maxDistanceMeters: number) {
    return this.findMany({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      isDeleted: false,
    }, { lean: true });
  }

  async findByDepartment(departmentId: string) {
    return this.findMany({ departmentId, isDeleted: false }, { lean: true, sort: { createdAt: -1 } });
  }

  async findByCitizen(citizenId: string) {
    return this.findMany({ citizenId, isDeleted: false }, { lean: true, sort: { createdAt: -1 } });
  }

  async findByStatus(status: string) {
    return this.findMany({ status, isDeleted: false }, { lean: true });
  }

  async findByPriority(priority: string) {
    return this.findMany({ priority, isDeleted: false }, { lean: true });
  }

  async findDuplicateCandidates(longitude: number, latitude: number, category: string, maxDistanceMeters: number = 50) {
    return this.findMany({
      category,
      status: { $nin: ['closed', 'rejected', 'resolved'] },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      isDeleted: false,
    }, { lean: true });
  }
}
