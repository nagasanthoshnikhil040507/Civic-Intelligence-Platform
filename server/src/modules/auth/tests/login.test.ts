import { AuthService } from '../services/AuthService';
import { ApiError } from '../../../utils/ApiError';

describe('AuthService - Login', () => {
  let authService: AuthService;
  let mockUserService: any;
  let mockAuditLogService: any;

  beforeEach(() => {
    authService = new AuthService();
    authService.comparePassword = jest.fn(); 
    authService.generateTokens = jest.fn().mockReturnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: '15m'
    });

    mockUserService = {
      findByEmail: jest.fn(),
      update: jest.fn(),
      recordLogin: jest.fn()
    };
    mockAuditLogService = {
      recordAction: jest.fn()
    };
  });

  it('should successfully login a user with correct credentials', async () => {
    const userDoc = {
      id: 'u1',
      email: 'test@test.com',
      passwordHash: 'hash',
      status: 'active',
      isDeleted: false,
      failedLoginAttempts: 0,
      role: 'citizen',
      toObject: function() { return { ...this }; }
    };
    mockUserService.findByEmail.mockResolvedValue(userDoc);
    (authService.comparePassword as jest.Mock).mockResolvedValue(true);

    const payload = { email: 'test@test.com', password: 'pwd' };
    const result = await authService.loginUser(payload, mockUserService, mockAuditLogService);

    expect(result.tokens).toBeDefined();
    expect(result.user.email).toBe('test@test.com');
    expect(mockUserService.recordLogin).toHaveBeenCalled();
    expect(mockAuditLogService.recordAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_LOGIN' }));
  });

  it('should throw 401 for unknown email', async () => {
    mockUserService.findByEmail.mockResolvedValue(null);
    const payload = { email: 'unknown@test.com', password: 'pwd' };

    await expect(authService.loginUser(payload, mockUserService, mockAuditLogService)).rejects.toThrow(ApiError);
  });

  it('should increment failed attempts and throw 401 for wrong password', async () => {
    const userDoc = {
      id: 'u1',
      email: 'test@test.com',
      passwordHash: 'hash',
      status: 'active',
      isDeleted: false,
      failedLoginAttempts: 0,
      toObject: function() { return { ...this }; }
    };
    mockUserService.findByEmail.mockResolvedValue(userDoc);
    (authService.comparePassword as jest.Mock).mockResolvedValue(false);

    const payload = { email: 'test@test.com', password: 'wrong' };

    await expect(authService.loginUser(payload, mockUserService, mockAuditLogService)).rejects.toThrow(ApiError);
    expect(mockUserService.update).toHaveBeenCalledWith('u1', expect.objectContaining({ $set: { failedLoginAttempts: 1 } }));
    expect(mockAuditLogService.recordAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOGIN_FAILED' }));
  });

  it('should lock account after max failed attempts', async () => {
    const userDoc = {
      id: 'u1',
      email: 'test@test.com',
      passwordHash: 'hash',
      status: 'active',
      isDeleted: false,
      failedLoginAttempts: 4, // Next fail should be 5 and lock it
      toObject: function() { return { ...this }; }
    };
    mockUserService.findByEmail.mockResolvedValue(userDoc);
    (authService.comparePassword as jest.Mock).mockResolvedValue(false);

    const payload = { email: 'test@test.com', password: 'wrong' };

    await expect(authService.loginUser(payload, mockUserService, mockAuditLogService)).rejects.toThrow(ApiError);
    expect(mockUserService.update).toHaveBeenCalledWith('u1', expect.objectContaining({
      $set: expect.objectContaining({ failedLoginAttempts: 5, lockedUntil: expect.any(Date) })
    }));
    expect(mockAuditLogService.recordAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'ACCOUNT_LOCKED' }));
  });

  it('should throw 401 if account is currently locked', async () => {
    const userDoc = {
      id: 'u1',
      email: 'test@test.com',
      status: 'active',
      isDeleted: false,
      lockedUntil: new Date(Date.now() + 100000), // Locked in future
      toObject: function() { return { ...this }; }
    };
    mockUserService.findByEmail.mockResolvedValue(userDoc);

    const payload = { email: 'test@test.com', password: 'pwd' };

    await expect(authService.loginUser(payload, mockUserService, mockAuditLogService)).rejects.toThrow('Account is temporarily locked');
  });

  it('should throw 401 if account is inactive', async () => {
    const userDoc = {
      id: 'u1',
      email: 'test@test.com',
      status: 'inactive',
      isDeleted: false,
      toObject: function() { return { ...this }; }
    };
    mockUserService.findByEmail.mockResolvedValue(userDoc);

    const payload = { email: 'test@test.com', password: 'pwd' };

    await expect(authService.loginUser(payload, mockUserService, mockAuditLogService)).rejects.toThrow('Account is inactive');
  });
});
