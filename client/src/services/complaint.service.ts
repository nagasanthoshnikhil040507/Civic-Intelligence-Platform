import { api } from './api';

export interface LocationPayload {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category: string;
  location: LocationPayload;
  address?: string;
  images?: string[];
}

export interface ComplaintResponse {
  _id: string;
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
  createdAt: string;
}

export class ComplaintService {
  static async create(payload: CreateComplaintPayload): Promise<ComplaintResponse> {
    const response = await api.post('/complaints', payload);
    return response.data.data;
  }

  static async getMyComplaints(): Promise<ComplaintResponse[]> {
    const response = await api.get('/complaints');
    const result = response.data.data;
    // Backend returns { data: [...], total, page, limit, totalPages }
    return Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
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

    const response = await api.post(`/complaints/${id}/images`, formData);
    return response.data.data;
  }

  static async removeImage(id: string, publicId: string): Promise<ComplaintResponse> {
    // URL encode the publicId as Cloudinary IDs can contain slashes (e.g. folder/filename)
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.delete(`/complaints/${id}/images/${encodedPublicId}`);
    return response.data.data;
  }
}
