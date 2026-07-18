import axios from 'axios';
import { ApiError } from '../utils/ApiError';
import { ComplaintService } from './ComplaintService';
import { config } from '../config/env';

export class AIService {
  private readonly fastApiUrl: string;
  private readonly complaintService: ComplaintService;

  constructor(complaintService: ComplaintService) {
    // FIX: Node 18+ resolves localhost to IPv6 (::1) but Uvicorn binds to IPv4 (127.0.0.1) by default.
    // Replace 'localhost' with '127.0.0.1' to prevent ECONNREFUSED errors.
    const aiUrl = config.aiServiceUrl || 'http://127.0.0.1:8000';
    this.fastApiUrl = aiUrl.replace('localhost', '127.0.0.1');
    this.complaintService = complaintService;
  }

  async analyzeComplaint(complaint: any): Promise<any> {
    const complaintId = complaint._id.toString();
    try {
      console.log(`[AIService] --- ENTER STAGE: analyzeComplaint for ${complaintId} ---`);
      // 2. Collect complaint images
      const imageUrls = complaint.images?.map((img: any) => img.url) || [];

      // 3. Extract parameters without mutating schema
      const latitude = complaint.location?.coordinates?.[1] || null;
      const longitude = complaint.location?.coordinates?.[0] || null;
      const description = complaint.description || "";
      
      const payload = {
        complaintId,
        imageUrls,
        latitude,
        longitude,
        description
      };
      
      console.log(`[AIService] Sending payload to FastAPI for ${complaintId}:`, JSON.stringify(payload));

      // 4. Send image URLs and metadata to FastAPI (with 1 retry and 30s timeout)
      const prediction = await this.callFastApiWithRetry('/api/v1/analyze', payload, 1, 30000);
      
      console.log(`[AIService] Received response from FastAPI for ${complaintId}:`, JSON.stringify(prediction));

      // 5. Store prediction inside MongoDB
      console.log(`[AIService] Updating MongoDB for ${complaintId} with AI Analysis results...`);
      console.log(`[AIService] aiAnalysis before update:`, JSON.stringify(complaint.aiAnalysis || null));
      const updatedComplaint = await this.complaintService.updateComplaint(complaintId, {
        $set: {
          aiAnalysis: {
            ...prediction,
            analyzedAt: new Date()
          }
        }
      } as any);

      console.log(`[AIService] Successfully updated MongoDB for ${complaintId}.`);
      console.log(`[AIService] aiAnalysis after update:`, JSON.stringify(updatedComplaint.aiAnalysis || null));
      // 6. Return prediction
      return updatedComplaint;
    } catch (error: any) {
      console.error(`[AIService] AI analysis failed for ${complaintId}:`, error.message || error);
      console.error(`[AIService] Stack Trace for ${complaintId}:\n`, error.stack);
      try {
        console.log(`[AIService] Updating MongoDB to FAILED for ${complaintId}...`);
        await this.complaintService.updateComplaint(complaintId, {
          $set: {
            'aiAnalysis.processingStatus': 'FAILED',
            'aiAnalysis.analyzedAt': new Date()
          }
        } as any);
      } catch (dbError: any) {
        console.error(`[AIService] Failed to update processingStatus for ${complaintId}:`, dbError);
        console.error(`[AIService] DB Error Stack Trace for ${complaintId}:\n`, dbError.stack);
      }
      // Re-throw if caller wants to handle it, though background tasks will swallow it
      this.handleAiError(error);
    }
  }

  private async callFastApiWithRetry(endpoint: string, payload: any, retries: number, timeoutMs: number): Promise<any> {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await axios.post(`${this.fastApiUrl}${endpoint}`, payload, {
          timeout: timeoutMs
        });
        return response.data;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AIService] FastAPI call failed (attempt ${i + 1}/${retries + 1}):`, error.message);
      }
    }
    
    throw lastError;
  }

  private handleAiError(error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new ApiError(504, 'AI Engine analysis timed out');
    }
    
    if (error.code === 'ECONNREFUSED' || !error.response) {
      throw new ApiError(503, 'AI Intelligence Engine is offline');
    }

    if (error.response?.status === 404) {
      throw new ApiError(404, 'AI model endpoint not found');
    }

    if (error.response?.status === 422) {
      throw new ApiError(400, 'Invalid payload sent to AI Engine');
    }

    throw new ApiError(500, 'AI Intelligence Engine encountered an error');
  }
}
