import request from 'supertest';
import app from '../../../app';

// Mock dependencies to avoid DB connection
jest.mock('../../../services/ComplaintService');
jest.mock('../../../services/AuditLogService');
jest.mock('../../../services/AIService', () => {
  return {
    AIService: jest.fn().mockImplementation(() => {
      return {
        analyzeComplaint: jest.fn().mockResolvedValue(true)
      };
    })
  };
});

// Mock Mongoose Auth Middleware
jest.mock('../../auth/middleware/auth.middleware', () => {
  return {
    authenticate: (req: any, res: any, next: any) => {
      req.user = { userId: 'mockUserId', role: 'citizen' };
      next();
    },
    authorize: () => (req: any, res: any, next: any) => next()
  };
});

import { ComplaintService } from '../../../services/ComplaintService';
import { AIService } from '../../../services/AIService';

describe('ComplaintController - AI Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Mock ComplaintService
    (ComplaintService.prototype.createCitizenComplaint as jest.Mock).mockResolvedValue({
      id: 'mockComplaintId',
      _id: 'mockComplaintId',
      title: 'Water leak',
      status: 'pending'
    });
    
    (ComplaintService.prototype.uploadImages as jest.Mock).mockResolvedValue({
      id: 'mockComplaintId',
      _id: 'mockComplaintId',
      title: 'Water leak',
      status: 'pending',
      images: [
        { url: 'http://res.cloudinary.com/demo/image/upload/v1234/test.jpg' }
      ]
    });
  });

  it('should NOT invoke AI service on complaint creation', async () => {
    const payload = {
      title: 'Water pipe burst',
      description: 'Massive leak on main street',
      category: 'water_leakage',
      location: {
        type: 'Point',
        coordinates: [78.4744, 17.3753]
      }
    };

    const res = await request(app).post('/api/v1/complaints').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Water leak');

    await new Promise(resolve => setTimeout(resolve, 50));

    // AI should NOT be invoked
    const mockAIServiceInstance = (AIService as jest.Mock).mock.results[0]?.value;
    if (mockAIServiceInstance) {
      expect(mockAIServiceInstance.analyzeComplaint).not.toHaveBeenCalled();
    }
  });

  it('should invoke AI service automatically after successful image upload', async () => {
    // 1. First "upload" an image
    // Note: We use supertest with .attach() to simulate multipart/form-data upload
    const res = await request(app)
      .post('/api/v1/complaints/mockComplaintId/images')
      .attach('images', Buffer.from('fake image data'), 'test.jpg');

    // 2. Image upload succeeds
    expect(res.status).toBe(200);

    // Wait a tick for async background process to execute
    await new Promise(resolve => setTimeout(resolve, 50));

    // 3. AI service IS invoked automatically
    const mockAIServiceInstance = (AIService as jest.Mock).mock.results[0].value;
    expect(mockAIServiceInstance.analyzeComplaint).toHaveBeenCalledTimes(1);
    expect(mockAIServiceInstance.analyzeComplaint).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mockComplaintId'
      })
    );
  });

  it('should not block image upload if AI service fails', async () => {
    // Mock AI service to reject
    const mockAIServiceInstance = (AIService as jest.Mock).mock.results[0]?.value;
    if (mockAIServiceInstance) {
       mockAIServiceInstance.analyzeComplaint.mockRejectedValue(new Error('AI Engine is offline'));
    } else {
       (AIService as jest.Mock).mockImplementationOnce(() => ({
         analyzeComplaint: jest.fn().mockRejectedValue(new Error('AI Engine is offline'))
       }));
    }

    const res = await request(app)
      .post('/api/v1/complaints/mockComplaintId/images')
      .attach('images', Buffer.from('fake image data'), 'test.jpg');

    // 1. Image upload still succeeds
    expect(res.status).toBe(200);
    
    // Process background microtask
    await new Promise(resolve => setTimeout(resolve, 50));
  });
});
