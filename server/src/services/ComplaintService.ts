import { BaseService } from './BaseService';
import { ComplaintRepository } from '../database/repositories/ComplaintRepository';
import { IComplaint } from '../database/models/Complaint';
import { ClientSession, Types } from 'mongoose';

export class ComplaintService extends BaseService<IComplaint, ComplaintRepository> {
  constructor(repository: ComplaintRepository) {
    super(repository);
  }

  async createComplaint(data: Partial<IComplaint>, session?: ClientSession) {
    data.status = 'pending';
    return this.create(data, session);
  }

  async updateComplaint(id: string, data: Partial<IComplaint>, session?: ClientSession) {
    return this.update(id, data, session);
  }

  async assignDepartment(complaintId: string, departmentId: string, assignedBy: string, session?: ClientSession) {
    return this.update(complaintId, { 
      $set: { departmentId },
      $push: { 
        timeline: { 
          status: 'assigned', 
          updatedBy: new Types.ObjectId(assignedBy), 
          timestamp: new Date(),
          note: `Assigned to department ${departmentId}`
        } 
      } 
    } as any, session);
  }

  async assignOfficer(complaintId: string, officerId: string, assignedBy: string, session?: ClientSession) {
    return this.update(complaintId, { 
      $set: { status: 'assigned' },
      $push: { 
        assignmentHistory: { officerId, assignedAt: new Date() },
        timeline: { 
          status: 'assigned', 
          updatedBy: new Types.ObjectId(assignedBy), 
          timestamp: new Date(),
          note: `Assigned to officer ${officerId}`
        } 
      } 
    } as any, session);
  }

  async updateStatus(complaintId: string, status: string, updatedBy: string, note?: string, session?: ClientSession) {
    return this.update(complaintId, { 
      $set: { status },
      $push: { 
        timeline: { 
          status, 
          updatedBy: new Types.ObjectId(updatedBy), 
          timestamp: new Date(),
          note
        } 
      } 
    } as any, session);
  }

  async addTimelineEntry(complaintId: string, status: string, updatedBy: string, note: string, session?: ClientSession) {
    return this.update(complaintId, { 
      $push: { 
        timeline: { status, updatedBy: new Types.ObjectId(updatedBy), timestamp: new Date(), note } 
      } 
    } as any, session);
  }

  async attachEvidence(complaintId: string, images: string[], session?: ClientSession) {
    return this.update(complaintId, { $push: { attachments: { $each: images } } } as any, session);
  }

  async getNearbyComplaints(longitude: number, latitude: number, maxDistance: number) {
    return this.repository.findNearbyComplaints(longitude, latitude, maxDistance);
  }

  async archiveComplaint(id: string, session?: ClientSession) {
    return this.updateStatus(id, 'closed', 'system', 'Archived by system', session);
  }

  async createCitizenComplaint(citizenId: string, data: any) {
    const payload = {
      ...data,
      citizenId,
      status: 'pending',
    };
    return this.create(payload);
  }

  async updateCitizenComplaint(complaintId: string, citizenId: string, data: any) {
    const { ApiError } = require('../utils/ApiError');
    const complaint = await this.getById(complaintId);
    
    if (complaint.citizenId.toString() !== citizenId) {
      throw new ApiError(403, 'Forbidden: You can only edit your own complaints');
    }

    if (complaint.status !== 'pending') {
      throw new ApiError(400, 'Cannot edit complaint after processing has started');
    }

    return this.update(complaintId, { $set: data });
  }

  async deleteCitizenComplaint(complaintId: string, citizenId: string) {
    const { ApiError } = require('../utils/ApiError');
    const complaint = await this.getById(complaintId);
    
    if (complaint.citizenId.toString() !== citizenId) {
      throw new ApiError(403, 'Forbidden: You can only delete your own complaints');
    }

    if (complaint.status !== 'pending') {
      throw new ApiError(400, 'Cannot delete complaint after processing has started');
    }

    return this.delete(complaintId);
  }

  async verifyOfficerAccess(complaint: any, officerId: string) {
    const { ApiError } = require('../utils/ApiError');
    const { Department } = require('../database/models/Department');
    
    // Admin always has access
    // Wait, we don't know if they are admin here, but usually admin doesn't hit this. We assume officer.
    
    // Check if directly assigned
    const isAssigned = complaint.assignmentHistory?.some((a: any) => a.officerId.toString() === officerId);
    if (isAssigned) return true;

    // Check if in officer's department
    if (complaint.departmentId) {
      const department = await Department.findById(complaint.departmentId);
      if (department && department.officers.includes(new Types.ObjectId(officerId))) {
        return true;
      }
    }

    // If neither assigned directly nor in their department, and it's already claimed/assigned
    if (complaint.status !== 'pending' && complaint.departmentId) {
       throw new ApiError(403, 'Forbidden: You cannot edit complaints assigned to other departments');
    }

    return true;
  }

  async uploadImages(complaintId: string, citizenId: string, files: Express.Multer.File[]) {
    const { ApiError } = require('../utils/ApiError');
    const { CloudinaryUtils } = require('../utils/cloudinary');
    const complaint = await this.getById(complaintId);
    
    if (complaint.citizenId.toString() !== citizenId && citizenId !== 'admin') {
      throw new ApiError(403, 'Forbidden: You can only upload images to your own complaints');
    }

    if (complaint.status !== 'pending') {
      throw new ApiError(400, 'Cannot upload images after processing has started');
    }

    if ((complaint.images?.length || 0) + files.length > 5) {
      throw new ApiError(400, 'Maximum of 5 images allowed per complaint');
    }

    const uploadPromises = files.map(file => CloudinaryUtils.uploadBuffer(file.buffer));
    const results = await Promise.all(uploadPromises);

    const newImages = results.map(result => ({
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      uploadedAt: new Date(),
    }));

    return this.update(complaintId, { 
      $push: { images: { $each: newImages } } 
    } as any);
  }

  async removeImage(complaintId: string, citizenId: string, imagePublicId: string) {
    const { ApiError } = require('../utils/ApiError');
    const { CloudinaryUtils } = require('../utils/cloudinary');
    const complaint = await this.getById(complaintId);
    
    if (complaint.citizenId.toString() !== citizenId && citizenId !== 'admin') {
      throw new ApiError(403, 'Forbidden: You can only delete your own images');
    }

    if (complaint.status !== 'pending') {
      throw new ApiError(400, 'Cannot delete images after processing has started');
    }

    const imageExists = complaint.images?.some((img: any) => img.publicId === imagePublicId);
    if (!imageExists) {
      throw new ApiError(404, 'Image not found in this complaint');
    }

    await CloudinaryUtils.deleteImage(imagePublicId);

    return this.update(complaintId, {
      $pull: { images: { publicId: imagePublicId } }
    } as any);
  }

  async resolveComplaint(complaintId: string, officerId: string, resolutionNote: string, files?: Express.Multer.File[]) {
    const { ApiError } = require('../utils/ApiError');
    const { CloudinaryUtils } = require('../utils/cloudinary');
    const complaint = await this.getById(complaintId);

    if (complaint.status === 'resolved' || complaint.status === 'closed') {
      throw new ApiError(400, 'Complaint is already resolved or closed');
    }

    let proofImages: string[] = [];
    if (files && files.length > 0) {
      if (files.length > 5) {
        throw new ApiError(400, 'Maximum of 5 proof images allowed');
      }
      const uploadPromises = files.map(file => CloudinaryUtils.uploadBuffer(file.buffer));
      const results = await Promise.all(uploadPromises);
      proofImages = results.map(result => result.secure_url);
    }

    return this.update(complaintId, {
      $set: { 
        status: 'resolved',
        resolutionDetails: {
          resolvedAt: new Date(),
          resolvedBy: new Types.ObjectId(officerId),
          resolutionNote,
          proofImages
        }
      },
      $push: {
        timeline: {
          status: 'resolved',
          updatedBy: new Types.ObjectId(officerId),
          timestamp: new Date(),
          note: resolutionNote
        }
      }
    } as any);
  }

  async buildQueryFilter(queryData: any, user: any) {
    const filter: any = { isDeleted: false };
    
    if (user.role === 'citizen') {
      filter.citizenId = user.userId;
    } 

    if (queryData.status) filter.status = queryData.status;
    if (queryData.category) filter.category = queryData.category;
    if (queryData.priority) filter.priority = queryData.priority;
    if (queryData.departmentId) filter.departmentId = queryData.departmentId;
    
    if (queryData.startDate || queryData.endDate) {
      filter.createdAt = {};
      if (queryData.startDate) filter.createdAt.$gte = new Date(queryData.startDate);
      if (queryData.endDate) filter.createdAt.$lte = new Date(queryData.endDate);
    }
    
    if (queryData.keyword) {
      filter.$or = [
        { title: { $regex: queryData.keyword, $options: 'i' } },
        { description: { $regex: queryData.keyword, $options: 'i' } },
      ];
    }

    return filter;
  }

  async buildGeoQueryFilter(queryData: any, user: any, type: 'nearby' | 'bbox') {
    const filter = await this.buildQueryFilter(queryData, user);

    if (type === 'nearby') {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [queryData.lng, queryData.lat],
          },
          $maxDistance: queryData.radius,
        },
      };
    } else if (type === 'bbox') {
      filter.location = {
        $geoWithin: {
          $box: [
            [queryData.minLng, queryData.minLat],
            [queryData.maxLng, queryData.maxLat],
          ],
        },
      };
    }

    return filter;
  }
}
