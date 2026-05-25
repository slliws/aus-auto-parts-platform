import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';

/**
 * Redis key for hourly API call counters.
 * Pattern: api_calls:{tenantId}:{YYYY-MM-DDTHH}
 * TTL: 2 hours (ensures cleanup while keeping current + previous hour available)
 */
const apiCallKey = (tenantId: string): string => {
  const now = new Date();
  const hourSlot = now.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  return `api_calls:${tenantId}:${hourSlot}`;
};

const API_CALL_TTL_SECONDS = 7200; // 2 hours

/**
 * Increment the API call counter for a tenant in the current hour bucket.
 * Non-fatal: logging failure does not interrupt the request.
 */
export const trackApiCall = async (tenantId: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const key = apiCallKey(tenantId);
    // INCR returns new count; set TTL only on first write (when count === 1)
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, API_CALL_TTL_SECONDS);
    }
    logger.debug('API call tracked', { tenantId, key, count });
  } catch (error) {
    logger.warn('Failed to track API call (non-fatal)', { tenantId, error });
  }
};

/**
 * Read the current-hour API call count for a tenant.
 * Returns 0 on any Redis error so callers degrade gracefully.
 */
export const getApiCallCount = async (tenantId: string): Promise<number> => {
  try {
    const client = getRedisClient();
    const key = apiCallKey(tenantId);
    const value = await client.get(key);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    logger.warn('Failed to read API call count (non-fatal)', { tenantId, error });
    return 0;
  }
};

/**
 * Express middleware — fires after the response leaves so it never delays the caller.
 * Only tracks calls from authenticated, tenant-scoped requests.
 */
export const apiCallTracker = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.on('finish', () => {
    const tenantId = req.user?.tenant_id ?? req.tenant?.id;
    if (tenantId) {
      // Fire-and-forget; errors are swallowed inside trackApiCall
      trackApiCall(tenantId).catch(() => {/* already logged inside */});
    }
  });
  next();
};

export default apiCallTracker;
