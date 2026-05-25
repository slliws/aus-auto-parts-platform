import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { TenantError } from '../utils/errors';
import { SubscriptionTier } from '@prisma/client';
import { getCache, setCache, deleteCache } from '../config/redis';

/**
 * Tenant context middleware for multi-tenant architecture
 * Sets tenant context based on authenticated user
 * Includes Redis caching to avoid DB hit on every request
 */

// Cache TTL: 5 minutes — balances freshness vs DB load
const TENANT_CACHE_TTL_SECONDS = 300;
const TENANT_CACHE_PREFIX = 'tenant:';

/**
 * Build a consistent Redis cache key for a tenant
 */
const tenantCacheKey = (tenantId: string): string =>
  `${TENANT_CACHE_PREFIX}${tenantId}`;

/**
 * Load tenant from Redis cache (returns null on miss or parse error)
 */
const loadTenantFromCache = async (tenantId: string) => {
  try {
    const cached = await getCache(tenantCacheKey(tenantId));
    if (!cached) return null;
    const tenant = JSON.parse(cached);
    // Rehydrate Date fields that JSON.parse turns into strings
    if (tenant.created_at) tenant.created_at = new Date(tenant.created_at);
    if (tenant.updated_at) tenant.updated_at = new Date(tenant.updated_at);
    logger.debug('Tenant loaded from cache', { tenantId });
    return tenant;
  } catch (error) {
    logger.warn('Failed to parse tenant from cache, will reload from DB', { tenantId, error });
    return null;
  }
};

/**
 * Write a tenant to Redis cache (non-fatal on failure)
 */
const cacheTenant = async (tenant: object & { id: string }): Promise<void> => {
  try {
    await setCache(
      tenantCacheKey(tenant.id),
      JSON.stringify(tenant),
      TENANT_CACHE_TTL_SECONDS
    );
    logger.debug('Tenant written to cache', { tenantId: tenant.id, ttl: TENANT_CACHE_TTL_SECONDS });
  } catch (error) {
    // Cache write failure is non-fatal — DB remains source of truth
    logger.warn('Failed to cache tenant (non-fatal)', { tenantId: tenant.id, error });
  }
};

/**
 * Loads tenant information from database and populates cache
 */
const loadTenantFromDb = async (tenantId: string) => {
  try {
    // Import here to avoid circular dependency
    const prisma = await import('../models/prisma').then(m => m.default);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      logger.error('Tenant not found in database', { tenantId });
      return null;
    }

    // Populate cache for future requests
    await cacheTenant(tenant);

    return tenant;
  } catch (error) {
    logger.error('Error loading tenant from DB', { tenantId, error });
    throw error;
  }
};

/**
 * Load tenant: cache-first, DB fallback
 */
const loadTenant = async (tenantId: string) => {
  const cached = await loadTenantFromCache(tenantId);
  if (cached) return cached;
  return loadTenantFromDb(tenantId);
};

/**
 * Invalidate a tenant's cache entry.
 * Call this whenever a tenant record is mutated (update, deactivate, tier change).
 * Exported so tenant.service.ts can call it directly.
 */
export const invalidateTenantCache = async (tenantId: string): Promise<void> => {
  try {
    await deleteCache(tenantCacheKey(tenantId));
    logger.debug('Tenant cache invalidated', { tenantId });
  } catch (error) {
    logger.warn('Failed to invalidate tenant cache (non-fatal)', { tenantId, error });
  }
};

/**
 * Tenant context middleware
 * Attaches tenant information to request based on authenticated user
 * Cache-first: Redis → DB → error
 */
export const setTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If no user, continue without tenant context (unauthenticated routes)
    if (!req.user) {
      return next();
    }

    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      logger.error('User has no tenant ID', { userId: req.user.id });
      throw new TenantError('User is not associated with a tenant', 400);
    }

    // Load tenant (cache-first, DB fallback)
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
 */
export const extractTenantFromSubdomain = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
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
  invalidateTenantCache,
};
