import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { setTenantContext, validateTenantId } from '../middleware/tenantContext';
import { dynamicRateLimiter, authRateLimiter } from '../middleware/rateLimiter';
import rateLimit from 'express-rate-limit';

// Rate limiter for public tenant registration (5 per hour per IP)
const tenantRegRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { success: false, message: 'Too many tenant registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
import { validateBody, validateParams } from '../middleware/validator';
import { tenantSchema, commonSchemas } from '../utils/validators';
import { UserRole } from '@prisma/client';
import * as tenantsController from '../controllers/tenants.controller';

/**
 * Tenant management routes
 * Handles tenant registration, configuration, and management
 */

const router = Router();

/**
 * @route   POST /api/v1/tenants
 * @desc    Register a new tenant (organization)
 * @access  Public (but requires admin approval)
 */
router.post(
  '/',
  tenantRegRateLimiter,
  validateBody(tenantSchema),
  tenantsController.createTenant
);

/**
 * All routes below require authentication
 */
router.use(authenticate);
router.use(setTenantContext);
router.use(dynamicRateLimiter);

/**
 * @route   GET /api/v1/tenants/:tenantId
 * @desc    Get tenant details
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:tenantId',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateTenantId,
  tenantsController.getTenantById
);

/**
 * @route   PUT /api/v1/tenants/:tenantId
 * @desc    Update tenant details
 * @access  Private (Admin only)
 */
router.put(
  '/:tenantId',
  authorize(UserRole.ADMIN),
  validateTenantId,
  tenantsController.updateTenant
);

/**
 * @route   GET /api/v1/tenants/:tenantId/subscription
 * @desc    Get tenant subscription details
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:tenantId/subscription',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateTenantId,
  tenantsController.getSubscription
);

/**
 * @route   PATCH /api/v1/tenants/:tenantId/subscription
 * @desc    Update tenant subscription tier
 * @access  Private (Admin only)
 */
router.patch(
  '/:tenantId/subscription',
  authorize(UserRole.ADMIN),
  validateTenantId,
  tenantsController.updateSubscription
);

/**
 * @route   GET /api/v1/tenants/:tenantId/settings
 * @desc    Get tenant settings
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:tenantId/settings',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateTenantId,
  tenantsController.getSettings
);

/**
 * @route   PUT /api/v1/tenants/:tenantId/settings
 * @desc    Update tenant settings
 * @access  Private (Admin only)
 */
router.put(
  '/:tenantId/settings',
  authorize(UserRole.ADMIN),
  validateTenantId,
  tenantsController.updateSettings
);

/**
 * @route   GET /api/v1/tenants/:tenantId/usage
 * @desc    Get tenant API usage statistics
 * @access  Private (Admin, Manager)
 */
router.get(
  '/:tenantId/usage',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateTenantId,
  tenantsController.getUsageStats
);

/**
 * @route   DELETE /api/v1/tenants/:tenantId
 * @desc    Deactivate tenant (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:tenantId',
  authorize(UserRole.ADMIN),
  validateTenantId,
  tenantsController.deactivateTenant
);

export default router;
