import { AuthService } from '../services/AuthService';
import { ApiError } from '../../../utils/ApiError';
import { JwtUtils } from '../utils/jwt';
import { TokenBlacklist } from '../utils/blacklist';

jest.mock('../utils/jwt');
jest.mock('../utils/blacklist');

describe('AuthService - Refresh and Logout', () => {
  let authService: AuthService;
  let mockAuditLogService: any;

  beforeEach(() => {
    authService = new AuthService();
    authService.generateTokens = jest.fn().mockReturnValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: '15m'
    });

    mockAuditLogService = {
      recordAction: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  it('should successfully refresh tokens and rotate session', async () => {
    const mockPayload = { userId: 'u1', role: 'citizen', sessionId: 's1' };
    (JwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
    (TokenBlacklist.isBlacklisted as jest.Mock).mockResolvedValue(false);

    const result = await authService.refreshTokens('old-refresh-token', mockAuditLogService);

    expect(result.accessToken).toBe('new-access');
    expect(TokenBlacklist.blacklistSession).toHaveBeenCalledWith('s1', expect.any(Number));
    expect(authService.generateTokens).toHaveBeenCalledWith(
      { userId: 'u1', role: 'citizen' }, 
      expect.any(String) 
    );
    expect(mockAuditLogService.recordAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'TOKEN_REFRESHED' }));
  });

  it('should throw 401 if refresh token is invalid or expired', async () => {
    (JwtUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(authService.refreshTokens('bad-token', mockAuditLogService)).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should throw 401 if session is blacklisted', async () => {
    const mockPayload = { userId: 'u1', role: 'citizen', sessionId: 's1' };
    (JwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
    (TokenBlacklist.isBlacklisted as jest.Mock).mockResolvedValue(true);

    await expect(authService.refreshTokens('revoked-token', mockAuditLogService)).rejects.toThrow('Session has been revoked');
  });

  it('should successfully logout and blacklist session', async () => {
    const payload = { userId: 'u1', sessionId: 's1' };
    await authService.logoutUser(payload, mockAuditLogService);

    expect(TokenBlacklist.blacklistSession).toHaveBeenCalledWith('s1', expect.any(Number));
    expect(mockAuditLogService.recordAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_LOGOUT' }));
  });
});
