import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../../utils/ApiError';
import { RolePermissions, Role } from '../constants/roles';

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(new ApiError(403, 'Forbidden: Insufficient role'));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role as Role;
    const userPermissions = RolePermissions[userRole] || [];

    if (!userPermissions.includes(permission)) {
      return next(new ApiError(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
};
