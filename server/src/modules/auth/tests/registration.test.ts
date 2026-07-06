import { AuthService } from '../services/AuthService';
import { ApiError } from '../../../utils/ApiError';

describe('AuthService - Registration', () => {
  let authService: AuthService;
  let mockUserService: any;
  let mockAuditLogService: any;

  beforeEach(() => {
    authService = new AuthService();
    mockUserService = {
      createUser: jest.fn()
    };
    mockAuditLogService = {
      recordAction: jest.fn()
    };
  });

  it('should successfully register a citizen with a strong password', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!'
    };

    mockUserService.createUser.mockResolvedValue({
      _id: 'user123',
      ...payload,
      passwordHash: 'hashedpwd',
      toObject: function() { return this; }
    });

    const result = await authService.registerCitizen(payload, mockUserService, mockAuditLogService);

    expect(result).toBeDefined();
    expect(result.passwordHash).toBeUndefined();
    expect(result.role).toBe('citizen');
    expect(mockUserService.createUser).toHaveBeenCalled();
    expect(mockAuditLogService.recordAction).toHaveBeenCalled();
  });

  it('should reject registration with a weak password', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'weak'
    };

    await expect(
      authService.registerCitizen(payload, mockUserService, mockAuditLogService)
    ).rejects.toThrow(ApiError);
    
    expect(mockUserService.createUser).not.toHaveBeenCalled();
    expect(mockAuditLogService.recordAction).not.toHaveBeenCalled();
  });

  it('should propagate Conflict error on duplicate email', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'duplicate@example.com',
      password: 'StrongPassword123!'
    };

    mockUserService.createUser.mockRejectedValue(new ApiError(409, 'User with this email already exists'));

    await expect(
      authService.registerCitizen(payload, mockUserService, mockAuditLogService)
    ).rejects.toThrow(ApiError);
  });
});
