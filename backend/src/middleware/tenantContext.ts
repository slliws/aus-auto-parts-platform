import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { TenantError } from '../utils/errors';
import { SubscriptionTier } from '@prisma/client';

/**
 * Tenant context middleware for multi-tenant architecture
 * Sets tenant context based on authenticated user
 * TODO: Implement actual tenant lookup from database
 */

/**
 * Loads tenant information from database
 */
const loadTenant = async (tenantId: string) => {
  try {
    // Import here to avoid circular dependency
    const prisma = await import('../models/prisma').then(m => m.default);
    
    // Get tenant from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    if (!tenant) {
      logger.error('Tenant not found in database', { tenantId });
      return null;
    }
    
    return tenant;
  } catch (error) {
    logger.error('Error loading tenant', { tenantId, error });
    throw error;
  }
};

/**
 * Tenant context middleware
 * Attaches tenant information to request based on authenticated user
 */
export const setTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Require authentication first
    if (!req.user) {
      // If no user, continue without tenant context
      // This allows unauthenticated routes to work
      return next();
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      logger.error('User has no tenant ID', { userId: req.user.id });
      throw new TenantError('User is not associated with a tenant', 400);
    }

    // Load tenant information
    // TODO: Implement caching to avoid database query on every request
    const tenant = await loadTenant(tenantId);

    if (!tenant) {
      throw new TenantError('Tenant not found', 404, tenantId);
    }

    // Check if tenant is active
    if (!tenant.is_active) {
      logger.warn('Inactive tenant access attempt', {
        tenantId,
        is_active: tenant.is_active,
      });
      throw new TenantError(
        'Tenant account is inactive. Please contact support.',
        403,
        tenantId
      );
    }

    // Attach tenant to request
    req.tenant = tenant;

    logger.debug('Tenant context set', {
      tenantId: tenant.id,
      subscriptionTier: tenant.subscription_tier,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validates tenant ID from request parameters
 * Ensures the tenant ID in the URL matches the authenticated user's tenant
 */
export const validateTenantId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const urlTenantId = req.params.tenantId;

    if (!urlTenantId) {
      return next();
    }

    if (!req.user) {
      throw new TenantError('Authentication required');
    }

    if (urlTenantId !== req.user.tenant_id) {
      logger.warn('Tenant ID mismatch', {
        userId: req.user.id,
        userTenantId: req.user.tenant_id,
        urlTenantId,
      });

      throw new TenantError(
        'Access to this tenant is not allowed',
        403,
        urlTenantId
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Subscription tier verification middleware factory
 * Ensures tenant has minimum required subscription tier
 */
export const requireSubscriptionTier = (...allowedTiers: SubscriptionTier[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.tenant) {
        throw new TenantError('Tenant context required');
      }

      if (!allowedTiers.includes(req.tenant.subscription_tier)) {
        logger.warn('Insufficient subscription tier', {
          tenantId: req.tenant.id,
          currentTier: req.tenant.subscription_tier,
          requiredTiers: allowedTiers,
        });

        throw new TenantError(
          `This feature requires ${allowedTiers.join(' or ')} subscription`,
          403,
          req.tenant.id
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Extracts tenant ID from subdomain (for future multi-domain setup)
 * TODO: Implement subdomain-based tenant identification
 */
export const extractTenantFromSubdomain = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // TODO: Implement subdomain to tenant ID mapping
    logger.debug('Subdomain detected', { subdomain });

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  setTenantContext,
  validateTenantId,
  requireSubscriptionTier,
  extractTenantFromSubdomain,
};