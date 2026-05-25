/**
 * Vehicle service
 * Handles business logic for vehicle management operations
 * Implements CRUD operations with multi-tenant isolation
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/errors';
import { Vehicle, Prisma } from '@prisma/client';
import { invalidateSearchCache } from './search.service';
import vinDecoderService, { VehicleDetails } from './vin-decoder.service';

/**
 * Interface for creating a new vehicle
 */
export interface CreateVehicleDTO {
  tenantId: string;
  customerId?: string;
  vin: string;
  registrationNumber?: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  transmission?: string;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  notes?: string;
}

/**
 * Interface for updating a vehicle
 */
export interface UpdateVehicleDTO {
  customerId?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
  transmission?: string;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Interface for vehicle search/filter parameters
 */
export interface VehicleFilters {
  search?: string;
  make?: string;
  model?: string;
  year?: number;
  customerId?: string;
  isActive?: boolean;
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface for paginated response
 */
export interface PaginatedVehiclesResponse {
  data: Vehicle[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Interface for audit log data
 */
interface AuditLogData {
  action: string;
  userId?: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId || null,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        changes: data.changes || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, data });
    // Don't throw - audit log failure shouldn't break the main operation
  }
};

/**
 * Get all vehicles with pagination and filtering
 */
export const getVehicles = async (
  tenantId: string,
  filters: VehicleFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedVehiclesResponse> => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause with tenant isolation
  const where: Prisma.VehicleWhereInput = {
    tenant_id: tenantId,
  };

  // Apply filters
  if (filters.search) {
    where.OR = [
      { vin: { contains: filters.search, mode: 'insensitive' } },
      { registration_number: { contains: filters.search, mode: 'insensitive' } },
      { make: { contains: filters.search, mode: 'insensitive' } },
      { model: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.make) {
    where.make = { equals: filters.make, mode: 'insensitive' };
  }

  if (filters.model) {
    where.model = { equals: filters.model, mode: 'insensitive' };
  }

  if (filters.year) {
    where.year = filters.year;
  }

  if (filters.customerId) {
    where.customer_id = filters.customerId;
  }

  if (filters.isActive !== undefined) {
    where.is_active = filters.isActive;
  }

  // Execute query with pagination
  const [vehicles, totalItems] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            parts: true,
          },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  logger.info('Vehicles retrieved', {
    tenantId,
    count: vehicles.length,
    totalItems,
    page,
    userId,
  });

  return {
    data: vehicles,
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (
  vehicleId: string,
  tenantId: string,
  userId?: string
): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      tenant_id: tenantId, // Ensure tenant isolation
    },
    include: {
      _count: {
        select: {
          parts: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  logger.info('Vehicle retrieved', { vehicleId, tenantId, userId });

  return vehicle;
};

/**
 * Create new vehicle
 */
export const createVehicle = async (
  data: CreateVehicleDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Vehicle> => {
  // Validate VIN format
  try {
    await vinDecoderService.validateVinFormat(data.vin);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid VIN format');
  }

  // Check if vehicle with VIN already exists for this tenant
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      tenant_id: data.tenantId,
      vin: data.vin,
    },
  });

  if (existingVehicle) {
    throw new ConflictError('Vehicle with this VIN already exists');
  }

  // If customerId is provided, validate it belongs to the tenant
  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenant_id: data.tenantId,
      },
    });

    if (!customer) {
      throw new ValidationError('Invalid customer ID');
    }
  }

  // Create vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      tenant_id: data.tenantId,
      customer_id: data.customerId || null,
      vin: data.vin,
      registration_number: data.registrationNumber || null,
      make: data.make,
      model: data.model,
      year: data.year,
      engine_number: data.engine || null,
      color: data.color || null,
      location: data.bodyType || null,
      notes: data.notes || null,
      is_active: true,
      date_received: new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'VEHICLE_CREATE',
    userId,
    tenantId: data.tenantId,
    resourceType: 'Vehicle',
    resourceId: vehicle.id,
    changes: {
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Vehicle created', {
    vehicleId: vehicle.id,
    vin: vehicle.vin,
    tenantId: data.tenantId,
    userId,
  });

  // Invalidate search cache for this tenant
  await invalidateSearchCache(data.tenantId, 'vehicle');

  return vehicle;
};

/**
 * Update vehicle
 */
export const updateVehicle = async (
  vehicleId: string,
  tenantId: string,
  data: UpdateVehicleDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Vehicle> => {
  // Check if vehicle exists and belongs to tenant
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      tenant_id: tenantId,
    },
  });

  if (!existingVehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // If customerId is provided, validate it belongs to the tenant
  if (data.customerId) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenant_id: tenantId,
      },
    });

    if (!customer) {
      throw new ValidationError('Invalid customer ID');
    }
  }

  // Prepare update data
  const updateData: Prisma.VehicleUpdateInput = {};
  if (data.customerId !== undefined) updateData.customer_id = data.customerId || null;
  if (data.registrationNumber !== undefined) updateData.registration_number = data.registrationNumber || null;
  if (data.make) updateData.make = data.make;
  if (data.model) updateData.model = data.model;
  if (data.year) updateData.year = data.year;
  if (data.engine !== undefined) updateData.engine_number = data.engine || null;
  if (data.transmission !== undefined) updateData.transmission = data.transmission || null;
  if (data.color !== undefined) updateData.color = data.color || null;
  if (data.bodyType !== undefined) updateData.location = data.bodyType || null;
  if (data.fuelType !== undefined) updateData.fuel_type = data.fuelType || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  // Update vehicle
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: updateData,
  });

  // Create audit log
  await createAuditLog({
    action: 'VEHICLE_UPDATE',
    userId,
    tenantId,
    resourceType: 'Vehicle',
    resourceId: vehicleId,
    changes: data,
    ipAddress,
    userAgent,
  });

  logger.info('Vehicle updated', {
    vehicleId,
    tenantId,
    userId,
  });

  // Invalidate search cache for this tenant
  await invalidateSearchCache(tenantId, 'vehicle');

  return updatedVehicle;
};

/**
 * Delete vehicle (soft delete - set is_active to false)
 */
export const deleteVehicle = async (
  vehicleId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Check if vehicle exists and belongs to tenant
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      tenant_id: tenantId,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  // Check if vehicle has active parts
  const partsCount = await prisma.part.count({
    where: {
      vehicle_id: vehicleId,
      is_available: true,
    },
  });

  if (partsCount > 0) {
    throw new ValidationError(
      'Cannot delete vehicle with active parts. Set as inactive instead.'
    );
  }

  // Soft delete - set is_active to false
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { is_active: false },
  });

  // Create audit log
  await createAuditLog({
    action: 'VEHICLE_DELETE',
    userId,
    tenantId,
    resourceType: 'Vehicle',
    resourceId: vehicleId,
    changes: {
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Vehicle deleted (soft delete)', {
    vehicleId,
    tenantId,
    userId,
  });

  // Invalidate search cache for this tenant
  await invalidateSearchCache(tenantId, 'vehicle');
};

/**
 * Search vehicles by query
 */
export const searchVehicles = async (
  tenantId: string,
  query: string,
  filters: VehicleFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedVehiclesResponse> => {
  // Use the getVehicles function with search filter
  return getVehicles(
    tenantId,
    { ...filters, search: query },
    pagination,
    userId
  );
};

/**
 * Get vehicles for a customer
 */
export const getCustomerVehicles = async (
  customerId: string,
  tenantId: string,
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedVehiclesResponse> => {
  // Verify customer belongs to tenant
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenant_id: tenantId,
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Get vehicles with customer filter
  return getVehicles(
    tenantId,
    { customerId },
    pagination,
    userId
  );
};

/**
 * Decode a VIN without saving
 */
export const decodeVin = async (
  vin: string,
  userId?: string
): Promise<VehicleDetails> => {
  try {
    // Validate VIN format
    vinDecoderService.validateVinFormat(vin);
    
    // Decode VIN using the VIN decoder service
    const vehicleDetails = await vinDecoderService.decodeVin(vin);
    
    logger.info('VIN decoded', {
      vin,
      userId,
      make: vehicleDetails.make,
      model: vehicleDetails.model,
      year: vehicleDetails.year,
    });
    
    return vehicleDetails;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Error decoding VIN', { vin, error, userId });
    throw new ValidationError('Failed to decode VIN');
  }
};

/**
 * Get list of vehicle makes
 */
export const getVehicleMakes = async (
  tenantId: string,
  userId?: string
): Promise<string[]> => {
  try {
    // Get list of makes from VIN decoder service
    const makes = vinDecoderService.getVehicleMakes();
    
    logger.info('Vehicle makes retrieved', { tenantId, count: makes.length, userId });
    
    return makes;
  } catch (error) {
    logger.error('Error retrieving vehicle makes', { tenantId, error, userId });
    throw new Error('Failed to retrieve vehicle makes');
  }
};

/**
 * Get list of models for a specific make
 */
export const getModelsForMake = async (
  make: string,
  tenantId: string,
  userId?: string
): Promise<string[]> => {
  try {
    // Get list of models for make from VIN decoder service
    const models = vinDecoderService.getModelsForMake(make);
    
    logger.info('Vehicle models retrieved', { tenantId, make, count: models.length, userId });
    
    return models;
  } catch (error) {
    logger.error('Error retrieving vehicle models', { tenantId, make, error, userId });
    throw new Error('Failed to retrieve vehicle models');
  }
};

export default {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  getCustomerVehicles,
  decodeVin,
  getVehicleMakes,
  getModelsForMake,
};