import { ComplaintService } from '../../../services/ComplaintService';
import { CloudinaryUtils } from '../../../utils/cloudinary';

jest.mock('../../../utils/cloudinary');

describe('ComplaintService - Image Upload', () => {
  let complaintService: ComplaintService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    complaintService = new ComplaintService(mockRepo);
    jest.clearAllMocks();
  });

  it('should successfully upload an image to an owned pending complaint', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'c1',
      citizenId: 'u1',
      status: 'pending',
      images: [],
    });
    
    (CloudinaryUtils.uploadBuffer as jest.Mock).mockResolvedValue({
      public_id: 'test_pub',
      secure_url: 'http://test.com/img.jpg',
      width: 100, height: 100, format: 'jpg', bytes: 1024
    });

    const mockFile = { buffer: Buffer.from('test') } as any;

    await complaintService.uploadImages('c1', 'u1', [mockFile]);

    expect(CloudinaryUtils.uploadBuffer).toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalledWith('c1', expect.objectContaining({
      $push: { images: { $each: expect.any(Array) } }
    }), undefined);
  });

  it('should reject upload if not owned by citizen', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'c1',
      citizenId: 'u2', 
      status: 'pending',
      images: [],
    });
    
    const mockFile = { buffer: Buffer.from('test') } as any;

    await expect(complaintService.uploadImages('c1', 'u1', [mockFile])).rejects.toThrow('Forbidden');
    expect(CloudinaryUtils.uploadBuffer).not.toHaveBeenCalled();
  });

  it('should reject upload if complaint is not pending', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'c1',
      citizenId: 'u1',
      status: 'in_progress', 
      images: [],
    });
    
    const mockFile = { buffer: Buffer.from('test') } as any;

    await expect(complaintService.uploadImages('c1', 'u1', [mockFile])).rejects.toThrow('Cannot upload images after processing has started');
  });

  it('should successfully delete an image and its Cloudinary asset', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'c1',
      citizenId: 'u1',
      status: 'pending',
      images: [{ publicId: 'test_pub' }],
    });
    
    (CloudinaryUtils.deleteImage as jest.Mock).mockResolvedValue(true);

    await complaintService.removeImage('c1', 'u1', 'test_pub');

    expect(CloudinaryUtils.deleteImage).toHaveBeenCalledWith('test_pub');
    expect(mockRepo.update).toHaveBeenCalledWith('c1', expect.objectContaining({
      $pull: { images: { publicId: 'test_pub' } }
    }), undefined);
  });
});
