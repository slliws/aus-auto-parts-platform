/**
 * Parts service
 * Handles business logic for parts inventory management operations
 * Implements CRUD operations with multi-tenant isolation
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/errors';
import { Part, Prisma } from '@prisma/client';

/**
 * Interface for creating a new part
 */
export interface CreatePartDTO {
  tenantId: string;
  vehicleId?: string;
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  condition?: string;
  costPrice: number;
  sellPrice: number;
  gstInclusive?: boolean;
  stockQuantity?: number;
  location?: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  imageUrl?: string;
  notes?: string;
}

/**
 * Interface for updating a part
 */
export interface UpdatePartDTO {
  vehicleId?: string;
  partNumber?: string;
  name?: string;
  description?: string;
  category?: string;
  condition?: string;
  costPrice?: number;
  sellPrice?: number;
  gstInclusive?: boolean;
  stockQuantity?: number;
  location?: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  imageUrl?: string;
  notes?: string;
  isAvailable?: boolean;
}

/**
 * Interface for part search/filter parameters
 */
export interface PartFilters {
  search?: string;
  category?: string;
  condition?: string;
  vehicleId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isAvailable?: boolean;
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
export interface PaginatedPartsResponse {
  data: Part[];
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
        changes: (data.changes || null) as Prisma.InputJsonValue,
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
 * Get all parts with pagination and filtering
 */
export const getParts = async (
  tenantId: string,
  filters: PartFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedPartsResponse> => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause with tenant isolation
  const where: Prisma.PartWhereInput = {
    tenant_id: tenantId,
  };

  // Apply filters
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { part_number: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.category) {
    where.category = { equals: filters.category, mode: 'insensitive' };
  }

  if (filters.condition) {
    where.condition = filters.condition as any;
  }

  if (filters.vehicleId) {
    where.vehicle_id = filters.vehicleId;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.sell_price = {};
    if (filters.minPrice !== undefined) {
      where.sell_price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.sell_price.lte = filters.maxPrice;
    }
  }

  if (filters.inStock !== undefined) {
    if (filters.inStock) {
      where.stock_quantity = { gt: 0 };
    } else {
      where.stock_quantity = { lte: 0 };
    }
  }

  if (filters.isAvailable !== undefined) {
    where.is_available = filters.isAvailable;
  }

  // Execute query with pagination
  const [parts, totalItems] = await Promise.all([
    prisma.part.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            vin: true,
          },
        },
      },
    }),
    prisma.part.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  logger.info('Parts retrieved', {
    tenantId,
    count: parts.length,
    totalItems,
    page,
    userId,
  });

  return {
    data: parts,
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/**
 * Get part by ID
 */
export const getPartById = async (
  partId: string,
  tenantId: string,
  userId?: string
): Promise<Part> => {
  const part = await prisma.part.findFirst({
    where: {
      id: partId,
      tenant_id: tenantId, // Ensure tenant isolation
    },
    include: {
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          variant: true,
          vin: true,
          engine_number: true,
        },
      },
    },
  });

  if (!part) {
    throw new NotFoundError('Part not found');
  }

  logger.info('Part retrieved', { partId, tenantId, userId });

  return part;
};

/**
 * Create new part
 */
export const createPart = async (
  data: CreatePartDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Part> => {
  // Check if part number already exists for this tenant
  const existingPart = await prisma.part.findFirst({
    where: {
      tenant_id: data.tenantId,
      part_number: data.partNumber,
    },
  });

  if (existingPart) {
    throw new ConflictError('Part with this part number already exists');
  }

  // If barcode provided, check uniqueness
  if (data.barcode) {
    const existingBarcode = await prisma.part.findUnique({
      where: { barcode: data.barcode },
    });

    if (existingBarcode) {
      throw new ConflictError('Part with this barcode already exists');
    }
  }

  // Validate vehicle exists if provided
  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: data.vehicleId,
        tenant_id: data.tenantId,
      },
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
  }

  // Create part
  const part = await prisma.part.create({
    data: {
      tenant_id: data.tenantId,
      vehicle_id: data.vehicleId || null,
      part_number: data.partNumber,
      name: data.name,
      description: data.description || null,
      category: data.category,
      condition: (data.condition as any) || 'USED_GOOD',
      cost_price: data.costPrice,
      sell_price: data.sellPrice,
      gst_inclusive: data.gstInclusive !== undefined ? data.gstInclusive : true,
      stock_quantity: data.stockQuantity !== undefined ? data.stockQuantity : 1,
      location: data.location || null,
      barcode: data.barcode || null,
      weight: data.weight || null,
      dimensions: data.dimensions || null,
      image_url: data.imageUrl || null,
      notes: data.notes || null,
      is_available: true,
    },
    include: {
      vehicle: true,
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'PART_CREATE',
    userId,
    tenantId: data.tenantId,
    resourceType: 'Part',
    resourceId: part.id,
    changes: {
      partNumber: part.part_number,
      name: part.name,
      category: part.category,
      sellPrice: part.sell_price.toString(),
    },
    ipAddress,
    userAgent,
  });

  logger.info('Part created', {
    partId: part.id,
    partNumber: part.part_number,
    tenantId: data.tenantId,
    userId,
  });

  return part;
};

/**
 * Update part
 */
export const updatePart = async (
  partId: string,
  tenantId: string,
  data: UpdatePartDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Part> => {
  // Check if part exists and belongs to tenant
  const existingPart = await prisma.part.findFirst({
    where: {
      id: partId,
      tenant_id: tenantId,
    },
  });

  if (!existingPart) {
    throw new NotFoundError('Part not found');
  }

  // If updating part number, check uniqueness
  if (data.partNumber && data.partNumber !== existingPart.part_number) {
    const duplicate = await prisma.part.findFirst({
      where: {
        tenant_id: tenantId,
        part_number: data.partNumber,
        id: { not: partId },
      },
    });

    if (duplicate) {
      throw new ConflictError('Part with this part number already exists');
    }
  }

  // If updating barcode, check uniqueness
  if (data.barcode && data.barcode !== existingPart.barcode) {
    const duplicateBarcode = await prisma.part.findFirst({
      where: {
        barcode: data.barcode,
        id: { not: partId },
      },
    });

    if (duplicateBarcode) {
      throw new ConflictError('Part with this barcode already exists');
    }
  }

  // If updating vehicle, validate it exists
  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: data.vehicleId,
        tenant_id: tenantId,
      },
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
  }

  // Prepare update data
  const updateData: Prisma.PartUpdateInput = {};
  if (data.vehicleId !== undefined) {
    updateData.vehicle = data.vehicleId
      ? { connect: { id: data.vehicleId } }
      : { disconnect: true };
  }
  if (data.partNumber) updateData.part_number = data.partNumber;
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category) updateData.category = data.category;
  if (data.condition) updateData.condition = data.condition as any;
  if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
  if (data.sellPrice !== undefined) updateData.sell_price = data.sellPrice;
  if (data.gstInclusive !== undefined) updateData.gst_inclusive = data.gstInclusive;
  if (data.stockQuantity !== undefined) updateData.stock_quantity = data.stockQuantity;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.barcode !== undefined) updateData.barcode = data.barcode;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;

  // Update part
  const updatedPart = await prisma.part.update({
    where: { id: partId },
    data: updateData,
    include: {
      vehicle: true,
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'PART_UPDATE',
    userId,
    tenantId,
    resourceType: 'Part',
    resourceId: partId,
    changes: data as Record<string, unknown>,
    ipAddress,
    userAgent,
  });

  logger.info('Part updated', {
    partId,
    tenantId,
    userId,
  });

  return updatedPart;
};

/**
 * Delete part (soft delete - set is_available to false)
 */
export const deletePart = async (
  partId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Check if part exists and belongs to tenant
  const part = await prisma.part.findFirst({
    where: {
      id: partId,
      tenant_id: tenantId,
    },
  });

  if (!part) {
    throw new NotFoundError('Part not found');
  }

  // Check if part is used in any quotes or orders
  const [quoteItemCount, orderItemCount] = await Promise.all([
    prisma.quoteItem.count({
      where: { part_id: partId },
    }),
    prisma.orderItem.count({
      where: { part_id: partId },
    }),
  ]);

  if (quoteItemCount > 0 || orderItemCount > 0) {
    throw new ValidationError(
      'Cannot delete part that is referenced in quotes or orders. Set it as unavailable instead.'
    );
  }

  // Soft delete - set is_available to false
  await prisma.part.update({
    where: { id: partId },
    data: { is_available: false },
  });

  // Create audit log
  await createAuditLog({
    action: 'PART_DELETE',
    userId,
    tenantId,
    resourceType: 'Part',
    resourceId: partId,
    changes: {
      partNumber: part.part_number,
      name: part.name,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Part deleted (soft delete)', {
    partId,
    tenantId,
    userId,
  });
};

/**
 * Search parts by query
 */
export const searchParts = async (
  tenantId: string,
  query: string,
  filters: PartFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedPartsResponse> => {
  // Use the getParts function with search filter
  return getParts(
    tenantId,
    { ...filters, search: query },
    pagination,
    userId
  );
};

/**
 * Get parts by category
 */
export const getPartsByCategory = async (
  tenantId: string,
  category: string,
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedPartsResponse> => {
  return getParts(
    tenantId,
    { category },
    pagination,
    userId
  );
};

/**
 * Get low stock parts
 */
export const getLowStockParts = async (
  tenantId: string,
  userId?: string
): Promise<Part[]> => {
  const parts = await prisma.part.findMany({
    where: {
      tenant_id: tenantId,
      is_available: true,
      stock_quantity: { lte: 5 }, // Low stock threshold
    },
    orderBy: { stock_quantity: 'asc' },
    include: {
      vehicle: {
        select: {
          make: true,
          model: true,
          year: true,
        },
      },
    },
  });

  logger.info('Low stock parts retrieved', {
    tenantId,
    count: parts.length,
    userId,
  });

  return parts;
};

/**
 * Get all unique categories for a tenant
 */
export const getCategories = async (tenantId: string): Promise<string[]> => {
  const parts = await prisma.part.findMany({
    where: { tenant_id: tenantId },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return parts.map(p => p.category);
};

export default {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  searchParts,
  getPartsByCategory,
  getLowStockParts,
  getCategories,
};