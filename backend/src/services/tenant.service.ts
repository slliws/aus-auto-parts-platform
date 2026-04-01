/**
 * Tenant service
 * Handles business logic for tenant management operations
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { SubscriptionTier } from '@prisma/client';

/**
 * Type definitions for tenant operations
 */
export interface CreateTenantInput {
  name: string;
  abn?: string;
  email: string;
  phone?: string;
  address?: string;
  subscription_tier?: SubscriptionTier;
}

export interface UpdateTenantInput {
  name?: string;
  abn?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSubscriptionInput {
  subscription_tier?: SubscriptionTier;
  trial_ends_at?: Date;
}

/**
 * Default quotas based on subscription tier
 */
const SUBSCRIPTION_QUOTAS = {
  BASIC: {
    max_users: 5,
    max_storage_mb: 1000,
    max_api_calls_per_hour: 1000,
  },
  PRO: {
    max_users: 20,
    max_storage_mb: 10000,
    max_api_calls_per_hour: 10000,
  },
  ENTERPRISE: {
    max_users: 100,
    max_storage_mb: 100000,
    max_api_calls_per_hour: 100000,
  },
};

/**
 * Create new tenant
 */
export const createTenant = async (tenantData: CreateTenantInput): Promise<any> => {
  try {
    logger.info('Creating new tenant', { name: tenantData.name });

    // Validate ABN format if provided
    if (tenantData.abn && !/^\d{11}$/.test(tenantData.abn.replace(/\s/g, ''))) {
      throw new ValidationError('Invalid ABN format. Must be 11 digits.');
    }

    // Check if ABN already exists
    if (tenantData.abn) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { abn: tenantData.abn },
      });

      if (existingTenant) {
        throw new ConflictError('A tenant with this ABN already exists');
      }
    }

    // Set default subscription tier
    const subscriptionTier = tenantData.subscription_tier || SubscriptionTier.BASIC;

    // Set trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantData.name,
        abn: tenantData.abn,
        email: tenantData.email,
        phone: tenantData.phone,
        address: tenantData.address,
        subscription_tier: subscriptionTier,
        is_active: true,
        trial_ends_at: trialEndsAt,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenant.id,
        action: 'CREATE',
        resource_type: 'Tenant',
        resource_id: tenant.id,
        changes: {
          created: {
            name: tenant.name,
            subscription_tier: tenant.subscription_tier,
          },
        },
      },
    });

    logger.info('Tenant created successfully', { tenantId: tenant.id });
    return tenant;
  } catch (error) {
    logger.error('Error creating tenant:', error);
    throw error;
  }
};

/**
 * Get tenant by ID
 */
export const getTenantById = async (tenantId: string): Promise<any> => {
  try {
    logger.info('Fetching tenant by ID', { tenantId });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            parts: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    logger.info('Tenant fetched successfully', { tenantId });
    return tenant;
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    throw error;
  }
};

/**
 * Update tenant
 */
export const updateTenant = async (
  tenantId: string,
  updateData: UpdateTenantInput
): Promise<any> => {
  try {
    logger.info('Updating tenant', { tenantId });

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    // Validate ABN format if provided
    if (updateData.abn && !/^\d{11}$/.test(updateData.abn.replace(/\s/g, ''))) {
      throw new ValidationError('Invalid ABN format. Must be 11 digits.');
    }

    // Check ABN uniqueness if changed
    if (updateData.abn && updateData.abn !== existingTenant.abn) {
      const abnExists = await prisma.tenant.findUnique({
        where: { abn: updateData.abn },
      });

      if (abnExists) {
        throw new ConflictError('A tenant with this ABN already exists');
      }
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        action: 'UPDATE',
        resource_type: 'Tenant',
        resource_id: tenantId,
        changes: {
          before: {
            name: existingTenant.name,
            abn: existingTenant.abn,
            email: existingTenant.email,
            phone: existingTenant.phone,
            address: existingTenant.address,
          },
          after: updateData,
        } as any,
      },
    });

    logger.info('Tenant updated successfully', { tenantId });
    return updatedTenant;
  } catch (error) {
    logger.error('Error updating tenant:', error);
    throw error;
  }
};

/**
 * Delete tenant (soft delete)
 */
export const deleteTenant = async (tenantId: string): Promise<void> => {
  try {
    logger.info('Deleting tenant', { tenantId });

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    // Soft delete by setting status to inactive
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        is_active: false,
        trial_ends_at: new Date(), // End trial/subscription immediately
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        action: 'DELETE',
        resource_type: 'Tenant',
        resource_id: tenantId,
        changes: {
          deleted: true,
        },
      },
    });

    logger.info('Tenant deleted successfully', { tenantId });
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    throw error;
  }
};

/**
 * Get subscription details
 */
export const getSubscription = async (tenantId: string): Promise<any> => {
  try {
    logger.info('Fetching subscription details', { tenantId });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        subscription_tier: true,
        is_active: true,
        trial_ends_at: true,
        created_at: true,
      },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    const quotas = SUBSCRIPTION_QUOTAS[tenant.subscription_tier];

    return {
      ...tenant,
      quotas,
      is_trial: tenant.trial_ends_at ? new Date() < tenant.trial_ends_at : false,
    };
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    throw error;
  }
};

/**
 * Update subscription
 */
export const updateSubscription = async (
  tenantId: string,
  data: UpdateSubscriptionInput
): Promise<any> => {
  try {
    logger.info('Updating subscription', { tenantId, data });

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    // Update subscription
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        action: 'UPDATE',
        resource_type: 'TenantSubscription',
        resource_id: tenantId,
        changes: {
          before: {
            subscription_tier: tenant.subscription_tier,
            trial_ends_at: tenant.trial_ends_at?.toISOString(),
          },
          after: {
            subscription_tier: data.subscription_tier,
            trial_ends_at: data.trial_ends_at?.toISOString(),
          },
        } as any,
      },
    });

    logger.info('Subscription updated successfully', { tenantId });
    return updatedTenant;
  } catch (error) {
    logger.error('Error updating subscription:', error);
    throw error;
  }
};

/**
 * Get tenant settings
 */
export const getSettings = async (tenantId: string): Promise<Record<string, any>> => {
  try {
    logger.info('Fetching tenant settings', { tenantId });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    // Return default settings (since settings field doesn't exist in schema yet)
    const defaultSettings = {
      notifications: {
        email_enabled: true,
        sms_enabled: false,
      },
      business: {
        currency: 'AUD',
        timezone: 'Australia/Sydney',
        tax_rate: 0.1, // 10% GST
      },
      features: {
        quotes_enabled: true,
        inventory_tracking: true,
        warranty_claims: true,
      },
    };

    return defaultSettings;
  } catch (error) {
    logger.error('Error fetching tenant settings:', error);
    throw error;
  }
};

/**
 * Update tenant settings
 */
export const updateSettings = async (
  tenantId: string,
  settings: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    logger.info('Updating tenant settings', { tenantId });

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    // Validate settings structure
    if (typeof settings !== 'object' || settings === null) {
      throw new ValidationError('Settings must be a valid object');
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        action: 'UPDATE',
        resource_type: 'TenantSettings',
        resource_id: tenantId,
        changes: {
          settings: settings,
        },
      },
    });

    logger.info('Tenant settings updated successfully', { tenantId });
    return settings;
  } catch (error) {
    logger.error('Error updating tenant settings:', error);
    throw error;
  }
};

/**
 * Get usage statistics
 */
export const getUsageStats = async (tenantId: string): Promise<any> => {
  try {
    logger.info('Fetching usage statistics', { tenantId });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    // Get counts
    const [userCount, customerCount, vehicleCount, partCount, orderCount] = await Promise.all([
      prisma.user.count({ where: { tenant_id: tenantId, is_active: true } }),
      prisma.customer.count({ where: { tenant_id: tenantId, is_active: true } }),
      prisma.vehicle.count({ where: { tenant_id: tenantId, is_active: true } }),
      prisma.part.count({ where: { tenant_id: tenantId, is_available: true } }),
      prisma.order.count({ where: { tenant_id: tenantId } }),
    ]);

    // Calculate storage (estimate based on parts with images)
    const partsWithImages = await prisma.part.count({
      where: {
        tenant_id: tenantId,
        image_url: { not: null },
      },
    });

    // Estimate 500KB per image on average
    const estimatedStorageMB = (partsWithImages * 0.5).toFixed(2);

    const quotas = SUBSCRIPTION_QUOTAS[tenant.subscription_tier];

    return {
      storage: {
        used_mb: parseFloat(estimatedStorageMB),
        limit_mb: quotas.max_storage_mb,
        percentage: ((parseFloat(estimatedStorageMB) / quotas.max_storage_mb) * 100).toFixed(2),
      },
      users: {
        count: userCount,
        limit: quotas.max_users,
        percentage: ((userCount / quotas.max_users) * 100).toFixed(2),
      },
      resources: {
        customers: customerCount,
        vehicles: vehicleCount,
        parts: partCount,
        orders: orderCount,
      },
      api_calls: {
        // TODO: Implement API call tracking
        hourly_count: 0,
        limit: quotas.max_api_calls_per_hour,
        percentage: '0.00',
      },
    };
  } catch (error) {
    logger.error('Error fetching usage statistics:', error);
    throw error;
  }
};

/**
 * Validate tenant limits
 */
export const validateTenantLimits = async (tenantId: string): Promise<any> => {
  try {
    logger.info('Validating tenant limits', { tenantId });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant with ID ${tenantId} not found`);
    }

    const stats = await getUsageStats(tenantId);
    const quotas = SUBSCRIPTION_QUOTAS[tenant.subscription_tier];

    const violations: string[] = [];

    // Check storage limit
    if (stats.storage.used_mb > quotas.max_storage_mb) {
      violations.push(`Storage limit exceeded: ${stats.storage.used_mb}MB / ${quotas.max_storage_mb}MB`);
    }

    // Check user limit
    if (stats.users.count > quotas.max_users) {
      violations.push(`User limit exceeded: ${stats.users.count} / ${quotas.max_users}`);
    }

    // Check API rate limit (if tracking is implemented)
    if (stats.api_calls.hourly_count > quotas.max_api_calls_per_hour) {
      violations.push(
        `API rate limit exceeded: ${stats.api_calls.hourly_count} / ${quotas.max_api_calls_per_hour} calls per hour`
      );
    }

    const isValid = violations.length === 0;

    logger.info('Tenant limits validation completed', { tenantId, isValid, violations });

    return {
      valid: isValid,
      violations,
      quotas,
      usage: stats,
    };
  } catch (error) {
    logger.error('Error validating tenant limits:', error);
    throw error;
  }
};

export default {
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
  getSubscription,
  updateSubscription,
  getSettings,
  updateSettings,
  getUsageStats,
  validateTenantLimits,
};