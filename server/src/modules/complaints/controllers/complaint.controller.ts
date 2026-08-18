import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ComplaintService } from '../../../services/ComplaintService';
import { AuditLogService } from '../../../services/AuditLogService';
import { ComplaintRepository } from '../../../database/repositories/ComplaintRepository';
import { AuditLogRepository } from '../../../database/repositories/AuditLogRepository';
import { createComplaintSchema, updateComplaintSchema, queryComplaintSchema } from '../validators/complaints.validator';
import { ComplaintRepository } from '../../../database/repositories/ComplaintRepository';
import { AuditLogRepository } from '../../../database/repositories/AuditLogRepository';
import { createComplaintSchema, updateComplaintSchema, queryComplaintSchema } from '../validators/complaints.validator';
import { ApiError } from '../../../utils/ApiError';
import { ApiResponse } from '../../../utils/ApiResponse';
import fs from 'fs';
import path from 'path';

const complaintRepository = new ComplaintRepository();
const auditLogRepository = new AuditLogRepository();
const complaintService = new ComplaintService(complaintRepository);
const auditLogService = new AuditLogService(auditLogRepository);

export class ComplaintController {
  
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createComplaintSchema.parse(req.body);
      const userId = req.user!.userId;

      // Extract aiAnalysis if present
      const { aiAnalysis, ...complaintData } = validatedData;
      
      const complaint = await complaintService.createCitizenComplaint(userId, complaintData);

      // If pre-submission aiAnalysis exists, update it immediately
      if (aiAnalysis) {
        await complaintService.updateComplaint(complaint.id, { $set: { aiAnalysis } } as any);
        if (aiAnalysis.priority !== undefined) {
          await complaintService.updateComplaint(complaint.id, { $set: { priority: aiAnalysis.priority } } as any);
        }
        if (aiAnalysis.confidence !== undefined) {
          await complaintService.updateComplaint(complaint.id, { $set: { confidenceScore: aiAnalysis.confidence } } as any);
        }
        if (aiAnalysis.matchedComplaintId) {
          await complaintService.updateComplaint(complaint.id, { $set: { linkedComplaintId: aiAnalysis.matchedComplaintId } } as any);
        }
        complaint.aiAnalysis = aiAnalysis as any;
      }

      await auditLogService.recordEntityChange(
        'Complaint',
        complaint.id,
        'COMPLAINT_CREATED',
        [],
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json(new ApiResponse(201, complaint, 'Complaint created successfully'));

    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(400, `Validation Error: ${error.errors.map(e => e.message).join(', ')}`));
      }
      next(error);
    }
  }

  static async getMyComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParams = queryComplaintSchema.parse(req.query);
      const filter = await complaintService.buildQueryFilter(queryParams, req.user);
      
      const result = await complaintService.paginate(filter, queryParams.page, queryParams.limit, { sort: { createdAt: -1 }, lean: true });
      
      res.status(200).json(new ApiResponse(200, result, 'Complaints retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const complaint = await complaintService.getById(req.params.id, { lean: true });
      
      if (req.user!.role === 'citizen' && complaint.citizenId.toString() !== req.user!.userId) {
        throw new ApiError(403, 'Forbidden');
      }

      res.status(200).json(new ApiResponse(200, complaint, 'Complaint retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateComplaintSchema.parse(req.body);
      const userId = req.user!.userId;

      const complaint = await complaintService.updateCitizenComplaint(req.params.id, userId, validatedData);

      await auditLogService.recordEntityChange(
        'Complaint',
        complaint.id,
        'COMPLAINT_UPDATED',
        [],
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(new ApiResponse(200, complaint, 'Complaint updated'));
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(400, `Validation Error: ${error.errors.map(e => e.message).join(', ')}`));
      }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      await complaintService.deleteCitizenComplaint(req.params.id, userId);

      await auditLogService.recordEntityChange(
        'Complaint',
        req.params.id,
        'COMPLAINT_DELETED',
        [],
        userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(new ApiResponse(200, null, 'Complaint deleted'));
    } catch (error) {
      next(error);
    }
  }

  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { assignComplaintSchema } = require('../validators/complaints.validator');
      const validatedData = assignComplaintSchema.parse(req.body);
      const officerId = req.user!.userId; // The one assigning

      let complaint;
      if (validatedData.departmentId) {
        complaint = await complaintService.assignDepartment(req.params.id, validatedData.departmentId, officerId);
      } else if (validatedData.officerId) {
        complaint = await complaintService.assignOfficer(req.params.id, validatedData.officerId, officerId);
      } else {
        throw new ApiError(400, 'Must provide officerId or departmentId');
      }

      await auditLogService.recordEntityChange('Complaint', req.params.id, 'COMPLAINT_ASSIGNED', [], officerId, req.ip, req.headers['user-agent']);
      res.status(200).json(new ApiResponse(200, complaint, 'Complaint assigned successfully'));
    } catch (error) {
      if (error instanceof ZodError) return next(new ApiError(400, `Validation Error: ${error.errors.map((e:any) => e.message).join(', ')}`));
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { updateStatusSchema } = require('../validators/complaints.validator');
      const validatedData = updateStatusSchema.parse(req.body);
      const officerId = req.user!.userId;

      // Status transitions validation
      const existingComplaint = await complaintService.getById(req.params.id);
      const currentStatus = existingComplaint.status;
      const newStatus = validatedData.status;

      const validTransitions: Record<string, string[]> = {
        'pending': ['assigned', 'rejected'],
        'assigned': ['in_progress'],
        'in_progress': ['resolved'],
        'resolved': ['closed'],
        'closed': [],
        'rejected': []
      };

      if (!validTransitions[currentStatus]?.includes(newStatus) && req.user!.role !== 'admin') {
        throw new ApiError(400, `Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      if (req.user!.role !== 'admin') {
        await complaintService.verifyOfficerAccess(existingComplaint, officerId);
      }

      const complaint = await complaintService.updateStatus(req.params.id, newStatus, officerId, validatedData.note);
      await auditLogService.recordEntityChange('Complaint', req.params.id, 'STATUS_UPDATED', [], officerId, req.ip, req.headers['user-agent']);
      res.status(200).json(new ApiResponse(200, complaint, 'Complaint status updated'));
    } catch (error) {
      if (error instanceof ZodError) return next(new ApiError(400, `Validation Error: ${error.errors.map((e:any) => e.message).join(', ')}`));
      next(error);
    }
  }

  static async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { resolveComplaintSchema } = require('../validators/complaints.validator');
      const validatedData = resolveComplaintSchema.parse(req.body);
      const officerId = req.user!.userId;

      const existingComplaint = await complaintService.getById(req.params.id);
      if (req.user!.role !== 'admin') {
        await complaintService.verifyOfficerAccess(existingComplaint, officerId);
      }

      const complaint = await complaintService.resolveComplaint(
        req.params.id, 
        officerId, 
        validatedData.resolutionNote, 
        req.files as Express.Multer.File[]
      );

      await auditLogService.recordEntityChange('Complaint', req.params.id, 'COMPLAINT_RESOLVED', [], officerId, req.ip, req.headers['user-agent']);
      res.status(200).json(new ApiResponse(200, complaint, 'Complaint resolved successfully'));
    } catch (error) {
      if (error instanceof ZodError) return next(new ApiError(400, `Validation Error: ${error.errors.map((e:any) => e.message).join(', ')}`));
      next(error);
    }
  }

  static async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('--- DEBUG: Incoming image upload request ---');
      console.log('Complaint ID:', req.params.id);
      console.log('Number of files received:', req.files ? (req.files as any[]).length : 0);
      
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any, i: number) => {
          console.log(`File ${i + 1}: mimetype=${file.mimetype}, size=${file.size} bytes`);
        });
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new ApiError(400, 'No image files provided');
      }

      const userId = req.user!.role === 'admin' ? 'admin' : req.user!.userId;
      
      console.log('Calling ComplaintService.uploadImages...');
      const complaint = await complaintService.uploadImages(req.params.id, userId, req.files as Express.Multer.File[]);
      console.log('Successfully updated MongoDB document for complaint:', complaint.id);

      await auditLogService.recordEntityChange(
        'Complaint',
        req.params.id,
        'IMAGE_UPLOADED',
        [],
        req.user!.userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(new ApiResponse(200, complaint, 'Images uploaded successfully'));

      // Trigger AI Analysis in the background (Non-blocking) ONLY if not already analyzed
      if (!complaint.aiAnalysis?.analyzedAt) {
        try {
          const { AIService } = require('../../../services/AIService');
          const aiService = new AIService(complaintService);
          aiService.analyzeComplaint(complaint).catch((err: any) => {
            // Errors are already logged and handled inside AIService
          });
        } catch (aiError) {
          console.error('[ComplaintController] Failed to initialize background AI service:', aiError);
        }
      }
    } catch (error: any) {
      console.error('--- DEBUG: Error in uploadImages ---');
      console.error('Stack trace:', error.stack || error);
      console.error('HTTP Status:', error.statusCode || 500);
      next(error);
    }
  }

  static async removeImage(req: Request, res: Response, next: NextFunction) {
    try {
      const publicId = req.params.publicId;
      if (!publicId) throw new ApiError(400, 'Image public ID is required');

      const userId = req.user!.role === 'admin' ? 'admin' : req.user!.userId;
      const complaint = await complaintService.removeImage(req.params.id, userId, publicId);

      await auditLogService.recordEntityChange(
        'Complaint',
        req.params.id,
        'IMAGE_REMOVED',
        [],
        req.user!.userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(new ApiResponse(200, complaint, 'Image removed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getNearbyComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const { nearbyQuerySchema } = require('../validators/complaints.validator');
      const queryParams = nearbyQuerySchema.parse(req.query);
      
      const filter = await complaintService.buildGeoQueryFilter(queryParams, req.user, 'nearby');
      
      // We do not pass sort: { createdAt: -1 } because $near natively sorts by distance
      const result = await complaintService.paginate(filter, queryParams.page, queryParams.limit, { lean: true });
      
      res.status(200).json(new ApiResponse(200, result, 'Nearby complaints retrieved'));
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(400, `Validation Error: ${error.errors.map(e => e.message).join(', ')}`));
      }
      next(error);
    }
  }

  static async getComplaintsInArea(req: Request, res: Response, next: NextFunction) {
    try {
      const { searchAreaQuerySchema } = require('../validators/complaints.validator');
      const queryParams = searchAreaQuerySchema.parse(req.query);
      
      const filter = await complaintService.buildGeoQueryFilter(queryParams, req.user, 'bbox');
      
      const result = await complaintService.paginate(filter, queryParams.page, queryParams.limit, { sort: { createdAt: -1 }, lean: true });
      
      res.status(200).json(new ApiResponse(200, result, 'Complaints in area retrieved'));
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(400, `Validation Error: ${error.errors.map(e => e.message).join(', ')}`));
      }
      next(error);
    }
  }
  static async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const complaint = await complaintService.getById(req.params.id);

      const { AIService } = require('../../../services/AIService');
      const aiService = new AIService(complaintService);
      
      const updatedComplaint = await aiService.analyzeComplaint(complaint);
      
      await auditLogService.recordEntityChange(
        'Complaint',
        req.params.id,
        'AI_ANALYSIS_COMPLETED',
        [],
        req.user!.userId,
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json(new ApiResponse(200, updatedComplaint, 'AI analysis completed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async analyzePreSubmission(req: Request, res: Response, next: NextFunction) {
    let tempImagePaths: string[] = [];
    try {
      const { title, description, category, latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        throw new ApiError(400, "Latitude and longitude are required for analysis.");
      }

      // 1. Process temporary files via multer
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
          tempImagePaths.push(file.path);
        });
      }
      
      // 2. Prepare payload for FastAPI AI Service
      const aiPayload = {
        complaintId: "temp_pre_submit",
        imageUrls: tempImagePaths,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: description || "",
        title: title || "",
        category: category || ""
      };
      
      // 3. Call AI Service directly
      const { config } = require('../../../config/env');
      const axios = require('axios');
      
      const aiUrl = config.aiServiceUrl || 'http://127.0.0.1:8000';
      const fastApiUrl = aiUrl.replace('localhost', '127.0.0.1');
      
      const response = await axios.post(`${fastApiUrl}/api/v1/analyze`, aiPayload, { timeout: 30000 });
      const prediction = response.data;
      
      // Transform to aiAnalysis format
      const aiAnalysisResult = {
        ...prediction,
        analyzedAt: new Date().toISOString(),
        garbageDetected: prediction.categoryPrediction === 'Garbage'
      };
      
      res.status(200).json(new ApiResponse(200, aiAnalysisResult, 'Pre-submission AI analysis completed'));
    } catch (error: any) {
      console.error('[ComplaintController] analyzePreSubmission failed:', error.message || error);
      res.status(200).json(new ApiResponse(200, {
        processingStatus: 'FAILED',
        message: 'AI analysis is temporarily unavailable. You can still submit your complaint normally.',
        duplicateDetected: false
      }, 'AI analysis failed gracefully'));
    } finally {
      // Clean up temp files
      tempImagePaths.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error(`Failed to delete temp file ${filePath}:`, e);
        }
      });
    }
  }
}
