import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config';
import { logger } from '../utils/logger';
import { RateLimitError } from '../utils/errors';
import { SubscriptionTier as PrismaSubscriptionTier } from '@prisma/client';

/**
 * Rate limiting middleware for the Australian Auto Parts Platform
 * Implements tiered rate limiting based on subscription level:
 * - Basic: 1,000 requests/hour
 * - Pro: 10,000 requests/hour
 * - Enterprise: 100,000 requests/hour
 */

/**
 * Gets rate limit configuration based on subscription tier
 */
const getRateLimitConfig = (tier?: PrismaSubscriptionTier): number => {
  switch (tier) {
    case 'ENTERPRISE':
      return config.rateLimit.maxEnterprise;
    case 'PRO':
      return config.rateLimit.maxPro;
    case 'BASIC':
    default:
      return config.rateLimit.maxBasic;
  }
};

/**
 * Custom key generator that includes tenant ID for multi-tenant rate limiting
 */
const keyGenerator = (req: Request): string => {
  const tenantId = req.tenant?.id || 'anonymous';
  const ip = req.ip || 'unknown';
  return `${tenantId}:${ip}`;
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  const tier = req.tenant?.subscription_tier || 'BASIC';
  const limit = getRateLimitConfig(tier);

  logger.warn('Rate limit exceeded', {
    tenantId: req.tenant?.id,
    tier,
    limit,
    ip: req.ip,
    path: req.path,
  });

  const error = new RateLimitError(
    `Rate limit exceeded. Maximum ${limit} requests per hour for ${tier} tier.`,
    config.rateLimit.windowMs / 1000
  );

  res.status(429).json({
    success: false,
    message: error.message,
    retryAfter: error.retryAfter,
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req: Request): boolean => {
  // Skip rate limiting for health check endpoints
  if (req.path === '/health' || req.path === '/api/v1/health') {
    return true;
  }

  // TODO: Add logic to skip rate limiting for admin users or specific IPs
  // if (req.user?.role === UserRole.ADMIN) return true;

  return false;
};

/**
 * Basic tier rate limiter (1,000 requests/hour)
 */
export const basicRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxBasic,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Pro tier rate limiter (10,000 requests/hour)
 */
export const proRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxPro,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Enterprise tier rate limiter (100,000 requests/hour)
 */
export const enterpriseRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxEnterprise,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dynamic rate limiter that applies limits based on tenant subscription tier
 * This middleware should be applied after authentication/tenant context middleware
 */
export const dynamicRateLimiter = (
  req: Request,
  res: Response,
  next: Function
): void => {
  const tier = req.tenant?.subscription_tier || 'BASIC';

  // Select appropriate rate limiter based on tier
  let rateLimiter;
  switch (tier) {
    case 'ENTERPRISE':
      rateLimiter = enterpriseRateLimiter;
      break;
    case 'PRO':
      rateLimiter = proRateLimiter;
      break;
    case 'BASIC':
    default:
      rateLimiter = basicRateLimiter;
      break;
  }

  // Apply the selected rate limiter
  rateLimiter(req, res, next);
};

/**
 * Strict rate limiter for sensitive endpoints (e.g., authentication)
 * 5 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  basicRateLimiter,
  proRateLimiter,
  enterpriseRateLimiter,
  dynamicRateLimiter,
  authRateLimiter,
};