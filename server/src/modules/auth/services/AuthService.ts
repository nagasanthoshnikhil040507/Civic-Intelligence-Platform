import { JwtUtils, TokenPayload } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { SecurityConfig } from '../constants/security';

/**
 * Pure Authentication Service
 * 
 * Documentation: Authentication Flow
 * 
 * User Login Sequence:
 * User -> /login (email, pwd)
 * Controller -> UserService (find user by email)
 * Controller -> AuthService.comparePassword()
 * Controller -> AuthService.generateTokens()
 * Controller -> Response (set secure cookie + return access token)
 */
export class AuthService {
  generateTokens(payload: Omit<TokenPayload, 'sessionId'>, sessionId: string = this.generateSessionId()) {
    const fullPayload: TokenPayload = { ...payload, sessionId };
    
    return {
      accessToken: JwtUtils.generateAccessToken(fullPayload),
      refreshToken: JwtUtils.generateRefreshToken(fullPayload),
      expiresIn: SecurityConfig.jwt.accessTokenExpiresIn,
    };
  }

  verifyAccessToken(token: string) {
    return JwtUtils.verifyAccessToken(token);
  }

  verifyRefreshToken(token: string) {
    return JwtUtils.verifyRefreshToken(token);
  }

  async hashPassword(password: string): Promise<string> {
    return PasswordUtils.hash(password);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return PasswordUtils.compare(password, hash);
  }

  async registerCitizen(data: any, userService: any, auditLogService: any) {
    const strength = PasswordUtils.validateStrength(data.password);
    if (!strength.isValid) {
      // Lazy load ApiError to avoid circular deps if any
      const { ApiError } = require('../../../utils/ApiError');
      throw new ApiError(400, `Weak password: ${strength.errors.join(', ')}`);
    }

    const passwordHash = await this.hashPassword(data.password);

    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: 'citizen',
      status: 'active',
      phone: data.phone,
      emailVerified: false,
    };

    const user = await userService.createUser(userData);

    await auditLogService.recordAction({
      action: 'USER_REGISTERED',
      entityModel: 'User',
      entityId: user._id,
      changes: [{ field: 'status', oldValue: null, newValue: 'active' }],
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.loginHistory;

    return safeUser;
  }

  async loginUser(data: any, userService: any, auditLogService: any) {
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCK_TIME_MS = 15 * 60 * 1000; // 15 mins

    // Lazy load ApiError to avoid circular deps
    const { ApiError } = require('../../../utils/ApiError');

    const user = await userService.findByEmail(data.email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.isDeleted) throw new ApiError(401, 'Invalid email or password');
    if (user.status === 'inactive') throw new ApiError(401, 'Account is inactive. Please contact support.');
    
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError(401, 'Account is temporarily locked due to too many failed attempts. Try again later.');
    }

    const isMatch = await this.comparePassword(data.password, user.passwordHash);

    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: attempts };
      
      let isLockedNow = false;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCK_TIME_MS);
        isLockedNow = true;
      }

      await userService.update(user.id, { $set: updates });

      await auditLogService.recordAction({
        action: isLockedNow ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        entityModel: 'User',
        entityId: user.id,
        changes: [{ field: 'failedLoginAttempts', oldValue: user.failedLoginAttempts, newValue: attempts }],
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      });

      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await userService.update(user.id, { $set: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    await userService.recordLogin(user.id, data.ipAddress, data.userAgent);

    const tokens = this.generateTokens({ userId: user.id, role: user.role });

    await auditLogService.recordAction({
      action: 'USER_LOGIN',
      entityModel: 'User',
      entityId: user.id,
      changes: [],
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.loginHistory;

    return { user: safeUser, tokens };
  }

  async refreshTokens(refreshToken: string, auditLogService: any, ipAddress?: string, userAgent?: string) {
    let payload;
    const { ApiError } = require('../../../utils/ApiError');
    try {
      payload = this.verifyRefreshToken(refreshToken);
    } catch (err: any) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const { TokenBlacklist } = require('../utils/blacklist');
    if (payload.sessionId && await TokenBlacklist.isBlacklisted(payload.sessionId)) {
      throw new ApiError(401, 'Session has been revoked. Please log in again.');
    }

    if (payload.sessionId) {
      await TokenBlacklist.blacklistSession(payload.sessionId, 7 * 24 * 60 * 60);
    }

    const newSessionId = this.generateSessionId();
    const tokens = this.generateTokens({ userId: payload.userId, role: payload.role }, newSessionId);

    await auditLogService.recordAction({
      action: 'TOKEN_REFRESHED',
      entityModel: 'User',
      entityId: payload.userId,
      changes: [],
      ipAddress,
      userAgent
    });

    return tokens;
  }

  async logoutUser(payload: any, auditLogService: any, ipAddress?: string, userAgent?: string) {
    if (payload && payload.sessionId) {
      const { TokenBlacklist } = require('../utils/blacklist');
      await TokenBlacklist.blacklistSession(payload.sessionId, 7 * 24 * 60 * 60);
      
      if (payload.userId) {
        await auditLogService.recordAction({
          action: 'USER_LOGOUT',
          entityModel: 'User',
          entityId: payload.userId,
          changes: [],
          ipAddress,
          userAgent
        });
      }
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
