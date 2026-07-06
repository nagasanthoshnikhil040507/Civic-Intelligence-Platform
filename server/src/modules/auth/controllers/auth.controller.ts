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
    console.log('[DEBUG] [AuthController.register] Incoming request received');
    console.log('[DEBUG] [AuthController.register] Body:', req.body);
    try {
      const validatedData = registerSchema.parse(req.body);
      console.log('[DEBUG] [AuthController.register] Validation passed:', validatedData);
      
      const payload = {
        ...validatedData,
        phone: req.body.phone,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      console.log('[DEBUG] [AuthController.register] Calling AuthService.registerCitizen');
      const user = await authService.registerCitizen(payload, userService, auditLogService);
      console.log('[DEBUG] [AuthController.register] User created successfully:', user);

      const tokens = authService.generateTokens({ userId: (user as any)._id || (user as any).id, role: user.role });
      console.log('[DEBUG] [AuthController.register] Tokens generated');

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
      console.log('[DEBUG] [AuthController.register] Returning response:', responsePayload);
      
      return res.status(201).json(responsePayload);
    } catch (error) {
      console.error('[DEBUG] [AuthController.register] Exception caught:', error);
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[DEBUG] [AuthController.register] ZodError:', errors);
        return next(new ApiError(400, `Validation Error: ${errors}`));
      }
      next(error);
    }
  }

  /**
   * @route POST /api/v1/auth/login
   * @desc Authenticates a user and returns tokens
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    console.log('[DEBUG] [AuthController.login] Incoming request received');
    console.log('[DEBUG] [AuthController.login] Body:', { ...req.body, password: '[REDACTED]' });
    try {
      const validatedData = loginSchema.parse(req.body);
      console.log('[DEBUG] [AuthController.login] Validation passed');

      const payload = {
        email: validatedData.email,
        password: validatedData.password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };

      console.log('[DEBUG] [AuthController.login] Calling AuthService.loginUser');
      const result = await authService.loginUser(payload, userService, auditLogService);
      console.log('[DEBUG] [AuthController.login] loginUser succeeded');

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
      
      console.log('[DEBUG] [AuthController.login] Returning response');
      return res.status(200).json(responsePayload);
    } catch (error) {
      console.error('[DEBUG] [AuthController.login] Exception caught:', error);
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[DEBUG] [AuthController.login] ZodError:', errors);
        return next(new ApiError(400, `Validation Error: ${errors}`));
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
