import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as tenantService from '../services/tenant.service';
import { SubscriptionTier } from '@prisma/client';
import { logger } from '../utils/logger';
import { validate, tenantSchema, updateTenantSchema } from '../utils/validators';

/**
 * Tenants controller
 * Handles tenant management operations — wired to tenant.service.ts
 */

/**
 * Create new tenant
 * @route POST /api/v1/tenants
 */
export const createTenant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validatedBody = validate<{ name: string; abn?: string; email: string; phone?: string; address?: string; subscription_tier?: string }>(tenantSchema, req.body);
    const { name, abn, email, phone, address, subscription_tier } = validatedBody;

    const tenant = await tenantService.createTenant({
      name,
      abn,
      email,
      phone,
      address,
      subscription_tier: subscription_tier as SubscriptionTier | undefined,
    });

    logger.info('Tenant created via API', { tenantId: tenant.id });

    const response: ApiResponse = {
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    };

    res.status(201).json(response);
  }
);

/**
 * Get tenant by ID
 * @route GET /api/v1/tenants/:tenantId
 */
export const getTenantById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;

    const tenant = await tenantService.getTenantById(tenantId);

    const response: ApiResponse = {
      success: true,
      message: 'Tenant retrieved successfully',
      data: tenant,
    };

    res.status(200).json(response);
  }
);

/**
 * Update tenant details
 * @route PUT /api/v1/tenants/:tenantId
 */
export const updateTenant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;
    const validatedBody = validate<{ name?: string; abn?: string; email?: string; phone?: string; address?: string }>(updateTenantSchema, req.body);
    const { name, abn, email, phone, address } = validatedBody;

    const updatedTenant = await tenantService.updateTenant(tenantId, {
      name,
      abn,
      email,
      phone,
      address,
    });

    logger.info('Tenant updated via API', { tenantId });

    const response: ApiResponse = {
      success: true,
      message: 'Tenant updated successfully',
      data: updatedTenant,
    };

    res.status(200).json(response);
  }
);

/**
 * Get tenant subscription details
 * @route GET /api/v1/tenants/:tenantId/subscription
 */
export const getSubscription = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;

    const subscription = await tenantService.getSubscription(tenantId);

    const response: ApiResponse = {
      success: true,
      message: 'Subscription details retrieved successfully',
      data: subscription,
    };

    res.status(200).json(response);
  }
);

/**
 * Update tenant subscription
 * @route PATCH /api/v1/tenants/:tenantId/subscription
 */
export const updateSubscription = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;
    const { subscription_tier, trial_ends_at } = req.body;

    const updatedSubscription = await tenantService.updateSubscription(tenantId, {
      subscription_tier,
      trial_ends_at: trial_ends_at ? new Date(trial_ends_at) : undefined,
    });

    logger.info('Tenant subscription updated via API', { tenantId, subscription_tier });

    const response: ApiResponse = {
      success: true,
      message: 'Subscription updated successfully',
      data: updatedSubscription,
    };

    res.status(200).json(response);
  }
);

/**
 * Get tenant settings
 * @route GET /api/v1/tenants/:tenantId/settings
 */
export const getSettings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;

    const settings = await tenantService.getSettings(tenantId);

    const response: ApiResponse = {
      success: true,
      message: 'Tenant settings retrieved successfully',
      data: settings,
    };

    res.status(200).json(response);
  }
);

/**
 * Update tenant settings
 * @route PUT /api/v1/tenants/:tenantId/settings
 */
export const updateSettings = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;
    const settings = req.body;

    const updatedSettings = await tenantService.updateSettings(tenantId, settings);

    logger.info('Tenant settings updated via API', { tenantId });

    const response: ApiResponse = {
      success: true,
      message: 'Tenant settings updated successfully',
      data: updatedSettings,
    };

    res.status(200).json(response);
  }
);

/**
 * Get tenant usage statistics
 * @route GET /api/v1/tenants/:tenantId/usage
 */
export const getUsageStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;

    const usageStats = await tenantService.getUsageStats(tenantId);

    const response: ApiResponse = {
      success: true,
      message: 'Usage statistics retrieved successfully',
      data: usageStats,
    };

    res.status(200).json(response);
  }
);

/**
 * Deactivate tenant (soft delete)
 * @route DELETE /api/v1/tenants/:tenantId
 */
export const deactivateTenant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId } = req.params;

    await tenantService.deleteTenant(tenantId);

    logger.info('Tenant deactivated via API', { tenantId });

    const response: ApiResponse = {
      success: true,
      message: 'Tenant deactivated successfully',
    };

    res.status(200).json(response);
  }
);

export default {
  createTenant,
  getTenantById,
  updateTenant,
  getSubscription,
  updateSubscription,
  getSettings,
  updateSettings,
  getUsageStats,
  deactivateTenant,
};
