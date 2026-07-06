import { ComplaintService } from '../../../services/ComplaintService';

describe('ComplaintService - Geospatial Queries', () => {
  let complaintService: ComplaintService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      paginate: jest.fn(),
    };
    complaintService = new ComplaintService(mockRepo);
  });

  it('should build nearby query filter correctly', async () => {
    const user = { userId: 'u1', role: 'citizen' };
    const query = { lat: 40.7128, lng: -74.0060, radius: 2000, status: 'pending' };
    
    const filter = await complaintService.buildGeoQueryFilter(query, user, 'nearby');
    
    expect(filter.citizenId).toBe('u1');
    expect(filter.status).toBe('pending');
    expect(filter.isDeleted).toBe(false);
    expect(filter.location.$near.$geometry.type).toBe('Point');
    expect(filter.location.$near.$geometry.coordinates).toEqual([-74.0060, 40.7128]);
    expect(filter.location.$near.$maxDistance).toBe(2000);
  });

  it('should build bbox query filter correctly', async () => {
    const user = { userId: 'u2', role: 'officer' }; // Officer sees all by default in this context unless departmentId is set
    const query = { minLng: -75, minLat: 40, maxLng: -73, maxLat: 42, category: 'roads' };
    
    const filter = await complaintService.buildGeoQueryFilter(query, user, 'bbox');
    
    expect(filter.category).toBe('roads');
    expect(filter.isDeleted).toBe(false);
    expect(filter.location.$geoWithin.$box).toEqual([[-75, 40], [-73, 42]]);
    
    // As officer, citizenId shouldn't be constrained automatically like it is for citizens
    expect(filter.citizenId).toBeUndefined();
  });
});
