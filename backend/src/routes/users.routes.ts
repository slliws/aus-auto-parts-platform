import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import { dynamicRateLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams } from '../middleware/validator';
import { paginationSchema, commonSchemas } from '../utils/validators';
import { UserRole } from '@prisma/client';
import * as usersController from '../controllers/users.controller';

/**
 * User management routes
 * Handles CRUD operations for users within a tenant
 */

const router = Router();

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(setTenantContext);
router.use(dynamicRateLimiter);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users in tenant (with pagination)
 * @access  Private (Admin, Manager)
 */
router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(paginationSchema),
  usersController.getUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin, Manager, or own user)
 */
router.get(
  '/:id',
  validateParams(commonSchemas.uuid),
  usersController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user in tenant
 * @access  Private (Admin, Manager)
 */
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  usersController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin, Manager, or own user)
 */
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  validateParams(commonSchemas.uuid),
  usersController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validateParams(commonSchemas.uuid),
  usersController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/activate
 * @desc    Activate user account
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/activate',
  authorize(UserRole.ADMIN),
  validateParams(commonSchemas.uuid),
  usersController.activateUser
);

/**
 * @route   PATCH /api/v1/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/deactivate',
  authorize(UserRole.ADMIN),
  validateParams(commonSchemas.uuid),
  usersController.deactivateUser
);

/**
 * @route   PATCH /api/v1/users/:id/change-password
 * @desc    Change user password
 * @access  Private (own user)
 */
router.patch(
  '/:id/change-password',
  validateParams(commonSchemas.uuid),
  usersController.changePassword
);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/role',
  authorize(UserRole.ADMIN),
  validateParams(commonSchemas.uuid),
  usersController.updateUserRole
);

export default router;
