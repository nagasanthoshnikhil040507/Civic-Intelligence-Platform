import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { SecurityConfig } from '../constants/security';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

export interface TokenPayload {
  userId: string;
  role: string;
  sessionId?: string; 
}

export class JwtUtils {
  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: SecurityConfig.jwt.accessTokenExpiresIn as any,
      issuer: SecurityConfig.jwt.issuer,
    };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: SecurityConfig.jwt.refreshTokenExpiresIn as any,
      issuer: SecurityConfig.jwt.issuer,
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
  }

  static verifyAccessToken(token: string): TokenPayload {
    const options: VerifyOptions = {
      issuer: SecurityConfig.jwt.issuer,
    };
    return jwt.verify(token, JWT_SECRET, options) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    const options: VerifyOptions = {
      issuer: SecurityConfig.jwt.issuer,
    };
    return jwt.verify(token, JWT_REFRESH_SECRET, options) as TokenPayload;
  }

  static decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null;
  }
}
