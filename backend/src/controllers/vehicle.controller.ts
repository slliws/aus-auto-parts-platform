import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as vehicleService from '../services/vehicle.service';
import * as vinDecoderService from '../services/vin-decoder.service';
import { logger } from '../utils/logger';

/**
 * Vehicle controller
 * Handles HTTP requests for vehicle management
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
 * Get all vehicles with pagination and filtering
 * @route GET /api/v1/vehicles
 */
export const getVehicles = asyncHandler(
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
    const filters: vehicleService.VehicleFilters = {};
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.make) filters.make = req.query.make as string;
    if (req.query.model) filters.model = req.query.model as string;
    if (req.query.year) filters.year = parseInt(req.query.year as string);
    if (req.query.customerId) filters.customerId = req.query.customerId as string;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const result = await vehicleService.getVehicles(
      tenantId,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { vehicles: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get single vehicle by ID
 * @route GET /api/v1/vehicles/:id
 */
export const getVehicleById = asyncHandler(
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

    const vehicle = await vehicleService.getVehicleById(id, tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { vehicle },
    };

    res.status(200).json(response);
  }
);

/**
 * Create new vehicle
 * @route POST /api/v1/vehicles
 */
export const createVehicle = asyncHandler(
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

    const vehicleData: vehicleService.CreateVehicleDTO = {
      tenantId,
      customerId: req.body.customerId,
      vin: req.body.vin,
      registrationNumber: req.body.registrationNumber,
      make: req.body.make,
      model: req.body.model,
      year: req.body.year,
      engine: req.body.engine,
      transmission: req.body.transmission,
      color: req.body.color,
      bodyType: req.body.bodyType,
      fuelType: req.body.fuelType,
      notes: req.body.notes,
    };

    const vehicle = await vehicleService.createVehicle(
      vehicleData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle created successfully',
      data: { vehicle },
    };

    res.status(201).json(response);
  }
);

/**
 * Update existing vehicle
 * @route PUT /api/v1/vehicles/:id
 */
export const updateVehicle = asyncHandler(
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

    const updateData: vehicleService.UpdateVehicleDTO = {};
    if (req.body.customerId !== undefined) updateData.customerId = req.body.customerId;
    if (req.body.registrationNumber !== undefined) updateData.registrationNumber = req.body.registrationNumber;
    if (req.body.make) updateData.make = req.body.make;
    if (req.body.model) updateData.model = req.body.model;
    if (req.body.year) updateData.year = req.body.year;
    if (req.body.engine !== undefined) updateData.engine = req.body.engine;
    if (req.body.transmission !== undefined) updateData.transmission = req.body.transmission;
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.bodyType !== undefined) updateData.bodyType = req.body.bodyType;
    if (req.body.fuelType !== undefined) updateData.fuelType = req.body.fuelType;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    const vehicle = await vehicleService.updateVehicle(
      id,
      tenantId,
      updateData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle },
    };

    res.status(200).json(response);
  }
);

/**
 * Delete vehicle (soft delete)
 * @route DELETE /api/v1/vehicles/:id
 */
export const deleteVehicle = asyncHandler(
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

    await vehicleService.deleteVehicle(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Vehicle deleted successfully',
    };

    res.status(200).json(response);
  }
);

/**
 * Search vehicles
 * @route GET /api/v1/vehicles/search
 */
export const searchVehicles = asyncHandler(
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
    const filters: vehicleService.VehicleFilters = {};
    if (req.query.make) filters.make = req.query.make as string;
    if (req.query.model) filters.model = req.query.model as string;
    if (req.query.year) filters.year = parseInt(req.query.year as string);
    if (req.query.customerId) filters.customerId = req.query.customerId as string;

    const result = await vehicleService.searchVehicles(
      tenantId,
      query,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { vehicles: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get customer's vehicles
 * @route GET /api/v1/vehicles/customer/:customerId
 */
export const getCustomerVehicles = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { customerId } = req.params;
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

    const result = await vehicleService.getCustomerVehicles(
      customerId,
      tenantId,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Decode VIN without saving
 * @route POST /api/v1/vehicles/decode-vin
 */
export const decodeVin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const { vin } = req.body;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    if (!vin) {
      const response: ApiResponse = {
        success: false,
        message: 'VIN is required',
      };
      res.status(400).json(response);
      return;
    }

    const vehicleDetails = await vehicleService.decodeVin(vin, userId);

    const response: ApiResponse = {
      success: true,
      data: { vehicleDetails },
    };

    res.status(200).json(response);
  }
);

/**
 * Get list of vehicle makes
 * @route GET /api/v1/vehicles/makes
 */
export const getVehicleMakes = asyncHandler(
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

    const makes = await vehicleService.getVehicleMakes(tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { makes },
    };

    res.status(200).json(response);
  }
);

/**
 * Get models for a specific make
 * @route GET /api/v1/vehicles/models/:make
 */
export const getModelsForMake = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { make } = req.params;
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

    if (!make) {
      const response: ApiResponse = {
        success: false,
        message: 'Make parameter is required',
      };
      res.status(400).json(response);
      return;
    }

    const models = await vehicleService.getModelsForMake(make, tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { models },
    };

    res.status(200).json(response);
  }
);

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