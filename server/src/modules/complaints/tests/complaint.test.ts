import { ComplaintService } from '../../../services/ComplaintService';

describe('ComplaintService - Domain Logic', () => {
  let complaintService: ComplaintService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    complaintService = new ComplaintService(mockRepo);
  });

  it('should successfully create a complaint with status pending', async () => {
    const payload = { title: 'Pothole', category: 'roads' };
    mockRepo.create.mockResolvedValue({ _id: 'c1', citizenId: 'u1', status: 'pending', ...payload });

    const result = await complaintService.createCitizenComplaint('u1', payload);
    
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ citizenId: 'u1', status: 'pending' }), undefined);
    expect(result.status).toBe('pending');
  });

  it('should prevent editing if status is not pending', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'c1',
      citizenId: 'u1',
      status: 'in_progress', // Not pending!
      toObject: function() { return this; }
    });

    await expect(complaintService.updateCitizenComplaint('c1', 'u1', { title: 'new' })).rejects.toThrow('Cannot edit complaint after processing has started');
  });

  it('should prevent user from editing someone elses complaint', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'c1',
      citizenId: 'u1', // Owner
      status: 'pending',
      toObject: function() { return this; }
    });

    // Trying to edit as u2
    await expect(complaintService.updateCitizenComplaint('c1', 'u2', { title: 'new' })).rejects.toThrow('Forbidden');
  });

  it('should build restricted query filter for citizen', async () => {
    const user = { userId: 'u1', role: 'citizen' };
    const query = { status: 'pending' };
    
    const filter = await complaintService.buildQueryFilter(query, user);
    
    expect(filter.citizenId).toBe('u1');
    expect(filter.status).toBe('pending');
    expect(filter.isDeleted).toBe(false);
  });
});
