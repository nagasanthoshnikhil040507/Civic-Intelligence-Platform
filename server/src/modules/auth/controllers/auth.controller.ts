import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthService } from '../services/AuthService';
import { UserService } from '../../../services/UserService';
import { AuditLogService } from '../../../services/AuditLogService';
import { UserRepository } from '../../../database/repositories/UserRepository';
import { AuditLogRepository } from '../../../database/repositories/AuditLogRepository';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { SecurityConfig } from '../constants/security';
import { ApiError } from '../../../utils/ApiError';
import { ApiResponse } from '../../../utils/ApiResponse';

// Instantiate dependencies (In a real app, use a DI container)
const userRepository = new UserRepository();
const auditLogRepository = new AuditLogRepository();
const userService = new UserService(userRepository);
const auditLogService = new AuditLogService(auditLogRepository);
const authService = new AuthService();

export class AuthController {
  /**
   * @route POST /api/v1/auth/register
   * @desc Registers a new citizen
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const payload = {
        ...validatedData,
        phone: req.body.phone,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const user = await authService.registerCitizen(payload, userService, auditLogService);

      const tokens = authService.generateTokens({ userId: (user as any)._id || (user as any).id, role: user.role });

      // Set Secure Cookies
      res.cookie('refreshToken', tokens.refreshToken, SecurityConfig.cookie);
      res.cookie('accessToken', tokens.accessToken, {
         ...SecurityConfig.cookie,
         maxAge: 15 * 60 * 1000 // 15 mins
      });

      const responsePayload = new ApiResponse(201, {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }, 'User registered successfully. Please verify your email.');
      
      return res.status(201).json(responsePayload);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        let msg = firstError.message;
        if (firstError.path.length > 0) {
          msg = `${firstError.path[0].toString().charAt(0).toUpperCase() + firstError.path[0].toString().slice(1)} is required`;
          if (firstError.message !== 'Required') {
             msg = `${firstError.path[0].toString().charAt(0).toUpperCase() + firstError.path[0].toString().slice(1)}: ${firstError.message}`;
          }
        }
        return res.status(400).json({ success: false, message: msg });
      }
      next(error);
    }
  }

  /**
   * @route POST /api/v1/auth/login
   * @desc Authenticates a user and returns tokens
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);

      const payload = {
        email: validatedData.email,
        password: validatedData.password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      const result = await authService.loginUser(payload, userService, auditLogService);

      // Set Secure Cookies
      res.cookie('refreshToken', result.tokens.refreshToken, SecurityConfig.cookie);
      res.cookie('accessToken', result.tokens.accessToken, {
         ...SecurityConfig.cookie,
         maxAge: 15 * 60 * 1000 // 15 mins
      });

      const responsePayload = new ApiResponse(200, {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken 
      }, 'Login successful');
      
      return res.status(200).json(responsePayload);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        let msg = firstError.message;
        if (firstError.path.length > 0) {
          msg = `${firstError.path[0].toString().charAt(0).toUpperCase() + firstError.path[0].toString().slice(1)} is required`;
          if (firstError.message !== 'Required') {
             msg = `${firstError.path[0].toString().charAt(0).toUpperCase() + firstError.path[0].toString().slice(1)}: ${firstError.message}`;
          }
        }
        return res.status(400).json({ success: false, message: msg });
      }
      next(error);
    }
  }

  /**
   * @route POST /api/v1/auth/refresh
   * @desc Refreshes access and refresh tokens
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      let token = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!token) {
        return next(new ApiError(401, 'Refresh token is required'));
      }

      const tokens = await authService.refreshTokens(
        token, 
        auditLogService, 
        req.ip, 
        req.headers['user-agent']
      );

      res.cookie('refreshToken', tokens.refreshToken, SecurityConfig.cookie);
      res.cookie('accessToken', tokens.accessToken, {
         ...SecurityConfig.cookie,
         maxAge: 15 * 60 * 1000 
      });

      return res.status(200).json(
        new ApiResponse(200, tokens, 'Tokens refreshed successfully')
      );
    } catch (error) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      next(error);
    }
  }

  /**
   * @route POST /api/v1/auth/logout
   * @desc Logs out user and clears cookies/session
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      let token = req.cookies?.refreshToken || req.body?.refreshToken;
      
      if (token) {
        const { JwtUtils } = require('../utils/jwt');
        const payload = JwtUtils.decodeToken(token);
        await authService.logoutUser(payload, auditLogService, req.ip, req.headers['user-agent']);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json(
        new ApiResponse(200, null, 'Logged out successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}
