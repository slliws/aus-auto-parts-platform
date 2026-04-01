/**
 * Search Controller
 * Handles HTTP requests for search operations
 */

import { Request, Response, NextFunction } from 'express';
import searchService, {
  EntityType,
  SearchFilters,
  PaginationParams
} from '../services/search.service';
import { logger } from '../utils/logger';

/**
 * Parse query parameters for pagination
 */
const parsePaginationParams = (req: Request): PaginationParams => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
  
  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: isNaN(pageSize) || pageSize < 1 || pageSize > 50 ? 10 : pageSize
  };
};

/**
 * Parse query parameters for filtering
 */
const parseFilterParams = (req: Request): SearchFilters => {
  const filters: SearchFilters = {};
  
  // Entity type filters
  if (req.query.entityTypes) {
    const entityTypes = (req.query.entityTypes as string).split(',');
    filters.entityTypes = entityTypes.filter(type => 
      Object.values(EntityType).includes(type as EntityType)
    ) as EntityType[];
  }
  
  // Part-specific filters
  if (req.query.category) filters.category = req.query.category as string;
  if (req.query.condition) filters.condition = req.query.condition as string;
  
  // Customer-specific filters
  if (req.query.customerType) filters.customerType = req.query.customerType as string;
  
  // Vehicle-specific filters
  if (req.query.vehicleMake) filters.vehicleMake = req.query.vehicleMake as string;
  if (req.query.vehicleModel) filters.vehicleModel = req.query.vehicleModel as string;
  
  if (req.query.minYear) {
    const minYear = parseInt(req.query.minYear as string, 10);
    if (!isNaN(minYear)) filters.minYear = minYear;
  }
  
  if (req.query.maxYear) {
    const maxYear = parseInt(req.query.maxYear as string, 10);
    if (!isNaN(maxYear)) filters.maxYear = maxYear;
  }
  
  return filters;
};

/**
 * Global search across all entity types
 */
export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenant_id: tenantId, id: userId } = req.user!;
    const query = req.query.query as string || '';
    
    const pagination = parsePaginationParams(req);
    const filters = parseFilterParams(req);
    
    logger.info('Global search request', {
      tenantId,
      userId,
      query,
      filters,
      pagination
    });
    
    const results = await searchService.globalSearch(
      tenantId,
      query,
      filters,
      pagination,
      userId
    );
    
    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Search only parts
 */
export const searchParts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenant_id: tenantId, id: userId } = req.user!;
    const query = req.query.query as string || '';
    
    const pagination = parsePaginationParams(req);
    const filters = parseFilterParams(req);
    
    const results = await searchService.searchPartsOnly(
      tenantId,
      query,
      filters,
      pagination,
      userId
    );
    
    return res.status(200).json({
      query,
      totalResults: results.total,
      results: results.results,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(results.total / (pagination.pageSize || 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search only customers
 */
export const searchCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenant_id: tenantId, id: userId } = req.user!;
    const query = req.query.query as string || '';
    
    const pagination = parsePaginationParams(req);
    const filters = parseFilterParams(req);
    
    const results = await searchService.searchCustomersOnly(
      tenantId,
      query,
      filters,
      pagination,
      userId
    );
    
    return res.status(200).json({
      query,
      totalResults: results.total,
      results: results.results,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(results.total / (pagination.pageSize || 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search only vehicles
 */
export const searchVehicles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenant_id: tenantId, id: userId } = req.user!;
    const query = req.query.query as string || '';
    
    const pagination = parsePaginationParams(req);
    const filters = parseFilterParams(req);
    
    const results = await searchService.searchVehiclesOnly(
      tenantId,
      query,
      filters,
      pagination,
      userId
    );
    
    return res.status(200).json({
      query,
      totalResults: results.total,
      results: results.results,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(results.total / (pagination.pageSize || 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  globalSearch,
  searchParts,
  searchCustomers,
  searchVehicles
};