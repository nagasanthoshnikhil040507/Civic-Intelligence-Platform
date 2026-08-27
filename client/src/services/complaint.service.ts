import { api } from './api';

export interface LocationPayload {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  location: LocationPayload;
  address?: string;
  images?: string[];
  aiAnalysis?: any;
}

export interface ComplaintResponse {
  _id: string;
  citizenId?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: LocationPayload;
  images: Array<{
    publicId: string;
    url: string;
    width?: number;
    height?: number;
  }>;
  timeline?: Array<{
    status: string;
    updatedBy?: string;
    timestamp: string;
    note?: string;
  }>;
  resolutionDetails?: {
    resolvedAt: string;
    resolvedBy: string;
    proofImages: string[];
    resolutionNote: string;
  };
  aiAnalysis?: {
    garbageDetected?: boolean;
    quantityEstimation?: string;
    confidence?: number;
    severity?: number;
    priority?: number;
    duplicateDetected?: boolean;
    matchedComplaintId?: string;
    processingStatus?: string;
    analyzedAt?: string;
    message?: string;
    summary?: string | null;
    similarity?: number | null;
    categoryPrediction?: string | null;
    duplicateLevel?: "HIGH" | "POSSIBLE" | "NONE";
    locationScore?: number;
    textScore?: number;
    imageScore?: number | null;
  };
  garbageQuantity?: 1 | 2 | 3;
  confidenceScore?: number;
  reportCount?: number;
  linkedComplaintId?: string;
  citizenVerification?: string;
  priority?: number;
  departmentId?: string;
  department?: any; // If populated
  updatedAt?: string;
  createdAt: string;
}

export class ComplaintService {
  static async analyzePreSubmission(payload: FormData): Promise<any> {
    const response = await api.post('/complaints/analyze-pre-submission', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }

  static async create(payload: CreateComplaintPayload): Promise<ComplaintResponse> {
    const response = await api.post('/complaints', payload);
    return response.data.data;
  }

  static async getMyComplaints(params?: Record<string, any>): Promise<ComplaintResponse[]> {
    const response = await api.get('/complaints', { params });
    const result = response.data.data;
    // Backend returns { data: [...], total, page, limit, totalPages }
    return Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
  }

  static async getComplaintsPaginated(params?: Record<string, any>): Promise<any> {
    const response = await api.get('/complaints', { params });
    return response.data.data;
  }

  static async getById(id: string): Promise<ComplaintResponse> {
    const response = await api.get(`/complaints/${id}`);
    return response.data.data;
  }

  static async uploadImages(id: string, files: File[]): Promise<ComplaintResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post(`/complaints/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }

  static async removeImage(id: string, publicId: string): Promise<ComplaintResponse> {
    // URL encode the publicId as Cloudinary IDs can contain slashes (e.g. folder/filename)
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.delete(`/complaints/${id}/images/${encodedPublicId}`);
    return response.data.data;
  }

  // --- Officer Specific Actions ---

  static async assignComplaint(id: string, payload: { officerId?: string; departmentId?: string }): Promise<ComplaintResponse> {
    const response = await api.patch(`/complaints/${id}/assign`, payload);
    return response.data.data;
  }

  static async analyzeComplaint(id: string): Promise<ComplaintResponse> {
    const response = await api.post(`/complaints/${id}/analyze`);
    return response.data.data;
  }

  static async updateStatus(id: string, payload: { status: string; note?: string }): Promise<ComplaintResponse> {
    const response = await api.patch(`/complaints/${id}/status`, payload);
    return response.data.data;
  }

  static async resolveComplaint(id: string, payload: { resolutionNote: string; workPerformed?: string }, files?: File[]): Promise<ComplaintResponse> {
    const formData = new FormData();
    formData.append('resolutionNote', payload.resolutionNote);
    if (payload.workPerformed) {
      formData.append('workPerformed', payload.workPerformed);
    }
    if (files) {
      files.forEach(file => {
        formData.append('images', file);
      });
    }

    const response = await api.post(`/complaints/${id}/resolve`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }
}
