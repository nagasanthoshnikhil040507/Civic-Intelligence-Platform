import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';
import { TokenBlacklist } from '../utils/blacklist';
import { ApiError } from '../../../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        sessionId?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = JwtUtils.verifyAccessToken(token);

    if (payload.sessionId && await TokenBlacklist.isBlacklisted(payload.sessionId)) {
      throw new ApiError(401, 'Session revoked. Please log in again.');
    }

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(new ApiError(401, 'Invalid authentication token'));
    }
  }
};

export const authenticateOptional = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (token) {
      req.user = JwtUtils.verifyAccessToken(token);
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  
  return null;
};
