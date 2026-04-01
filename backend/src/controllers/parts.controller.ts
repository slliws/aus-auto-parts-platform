import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as partsService from '../services/parts.service';
import { logger } from '../utils/logger';

/**
 * Parts controller
 * Handles HTTP requests for parts inventory management
 */

/**
 * Extract IP address from request
 */
const getIpAddress = (req: Request): string | undefined => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined
  );
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req: Request): string | undefined => {
  return req.headers['user-agent'] || undefined;
};

/**
 * Get all parts with pagination and filtering
 * @route GET /api/v1/parts
 */
export const getParts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Parse filters
    const filters: partsService.PartFilters = {};
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.condition) filters.condition = req.query.condition as string;
    if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;
    if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.inStock !== undefined) filters.inStock = req.query.inStock === 'true';
    if (req.query.isAvailable !== undefined) filters.isAvailable = req.query.isAvailable === 'true';

    const result = await partsService.getParts(
      tenantId,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { parts: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get single part by ID
 * @route GET /api/v1/parts/:id
 */
export const getPartById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const part = await partsService.getPartById(id, tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { part },
    };

    res.status(200).json(response);
  }
);

/**
 * Create new part
 * @route POST /api/v1/parts
 */
export const createPart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const partData: partsService.CreatePartDTO = {
      tenantId,
      vehicleId: req.body.vehicleId,
      partNumber: req.body.partNumber,
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      condition: req.body.condition,
      costPrice: req.body.costPrice,
      sellPrice: req.body.sellPrice,
      gstInclusive: req.body.gstInclusive,
      stockQuantity: req.body.stockQuantity,
      location: req.body.location,
      barcode: req.body.barcode,
      weight: req.body.weight,
      dimensions: req.body.dimensions,
      imageUrl: req.body.imageUrl,
      notes: req.body.notes,
    };

    const part = await partsService.createPart(
      partData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Part created successfully',
      data: { part },
    };

    res.status(201).json(response);
  }
);

/**
 * Update existing part
 * @route PUT /api/v1/parts/:id
 */
export const updatePart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const updateData: partsService.UpdatePartDTO = {};
    if (req.body.vehicleId !== undefined) updateData.vehicleId = req.body.vehicleId;
    if (req.body.partNumber) updateData.partNumber = req.body.partNumber;
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.condition) updateData.condition = req.body.condition;
    if (req.body.costPrice !== undefined) updateData.costPrice = req.body.costPrice;
    if (req.body.sellPrice !== undefined) updateData.sellPrice = req.body.sellPrice;
    if (req.body.gstInclusive !== undefined) updateData.gstInclusive = req.body.gstInclusive;
    if (req.body.stockQuantity !== undefined) updateData.stockQuantity = req.body.stockQuantity;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.barcode !== undefined) updateData.barcode = req.body.barcode;
    if (req.body.weight !== undefined) updateData.weight = req.body.weight;
    if (req.body.dimensions !== undefined) updateData.dimensions = req.body.dimensions;
    if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isAvailable !== undefined) updateData.isAvailable = req.body.isAvailable;

    const part = await partsService.updatePart(
      id,
      tenantId,
      updateData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Part updated successfully',
      data: { part },
    };

    res.status(200).json(response);
  }
);

/**
 * Delete part (soft delete)
 * @route DELETE /api/v1/parts/:id
 */
export const deletePart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    await partsService.deletePart(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Part deleted successfully',
    };

    res.status(200).json(response);
  }
);

/**
 * Search parts
 * @route GET /api/v1/parts/search
 */
export const searchParts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const query = req.query.q as string;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    if (!query) {
      const response: ApiResponse = {
        success: false,
        message: 'Search query is required',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Parse filters
    const filters: partsService.PartFilters = {};
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.condition) filters.condition = req.query.condition as string;
    if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;

    const result = await partsService.searchParts(
      tenantId,
      query,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { parts: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get parts by category
 * @route GET /api/v1/parts/category/:category
 */
export const getPartsByCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await partsService.getPartsByCategory(
      tenantId,
      category,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { parts: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get low stock parts
 * @route GET /api/v1/parts/low-stock
 */
export const getLowStockParts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const parts = await partsService.getLowStockParts(tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { parts },
    };

    res.status(200).json(response);
  }
);

/**
 * Get all categories
 * @route GET /api/v1/parts/categories
 */
export const getCategories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const categories = await partsService.getCategories(tenantId);

    const response: ApiResponse = {
      success: true,
      data: { categories },
    };

    res.status(200).json(response);
  }
);

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