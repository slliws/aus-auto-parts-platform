import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../models/prisma';
import { UserRole } from '@prisma/client';

/**
 * Authentication middleware for the Australian Auto Parts Platform
 * Verifies JWT tokens and attaches user information to requests
 */

/**
 * Extracts JWT token from Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user and tenant information to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const token = extractToken(req);
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    // Verify token using JWT utility
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('User account is inactive');
    }

    // Fetch tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenant_id },
    });

    if (!tenant) {
      throw new AuthenticationError('Tenant not found');
    }

    if (!tenant.is_active) {
      throw new AuthenticationError('Tenant is not active');
    }

    // Attach user and tenant to request (excluding password_hash)
    const { password_hash, ...sanitizedUser } = user;
    req.user = sanitizedUser as any;
    req.tenant = tenant as any;

    // Set tenant context for Prisma middleware
    req.tenantId = tenant.id;

    logger.debug('User authenticated', {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyAccessToken(token);
      
      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user && user.is_active) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: user.tenant_id },
        });

        if (tenant && tenant.is_active) {
          const { password_hash, ...sanitizedUser } = user;
          req.user = sanitizedUser as any;
          req.tenant = tenant as any;
          req.tenantId = tenant.id;
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Authorization failed', {
          userId: req.user.id,
          userRole,
          allowedRoles,
          path: req.path,
        });

        throw new AuthorizationError(
          'You do not have permission to access this resource'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require email verified middleware
 * Ensures user has verified their email
 */
export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!req.user.email_verified) {
      throw new AuthenticationError(
        'Email verification required. Please verify your email to access this resource.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireEmailVerified,
};