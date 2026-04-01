/**
 * Search service
 * Handles global search functionality across multiple entities
 * Implements tenant isolation and relevance scoring
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import { Customer, Part, Vehicle } from '@prisma/client';

/**
 * Enum for entity types
 */
export enum EntityType {
  PART = 'part',
  CUSTOMER = 'customer',
  VEHICLE = 'vehicle'
}

/**
 * Interface for search result item
 */
export interface SearchResult {
  entity: EntityType;
  id: string;
  title: string;
  subtitle: string;
  details: string;
  url: string;
  relevance: number;
  imageUrl?: string;
}

/**
 * Interface for entity-specific search results
 */
interface EntitySearchResults {
  total: number;
  results: SearchResult[];
}

/**
 * Interface for search response
 */
export interface SearchResponse {
  query: string;
  totalResults: number;
  parts?: EntitySearchResults;
  customers?: EntitySearchResults;
  vehicles?: EntitySearchResults;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Interface for search filters
 */
export interface SearchFilters {
  entityTypes?: EntityType[];
  category?: string;
  condition?: string;
  customerType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  minYear?: number;
  maxYear?: number;
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Calculate relevance score for a search result based on how well it matches the query
 * Higher score means more relevant
 * @param item The item to score
 * @param query The search query
 * @param searchFields The fields that were matched
 * @returns Relevance score (0-100)
 */
const calculateRelevance = (
  item: any,
  query: string,
  searchFields: { field: string; weight: number }[]
): number => {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Calculate base score based on field matches
  searchFields.forEach(({ field, weight }) => {
    const value = String(item[field] || '').toLowerCase();
    
    // Exact match gets full weight
    if (value === queryLower) {
      score += weight;
    }
    // Starts with gets 75% of weight
    else if (value.startsWith(queryLower)) {
      score += weight * 0.75;
    }
    // Contains gets 50% of weight
    else if (value.includes(queryLower)) {
      score += weight * 0.5;
    }
  });
  
  // Normalize score to 0-100 range
  const maxPossibleScore = searchFields.reduce((sum, { weight }) => sum + weight, 0);
  return Math.round((score / maxPossibleScore) * 100);
};

/**
 * Map a part to a search result
 */
const mapPartToSearchResult = (part: Part, relevance: number): SearchResult => ({
  entity: EntityType.PART,
  id: part.id,
  title: part.name,
  subtitle: part.part_number,
  details: part.description || part.category,
  url: `/parts/${part.id}`,
  relevance,
  imageUrl: part.image_url || undefined,
});

/**
 * Map a customer to a search result
 */
const mapCustomerToSearchResult = (customer: Customer, relevance: number): SearchResult => ({
  entity: EntityType.CUSTOMER,
  id: customer.id,
  title: `${customer.first_name} ${customer.last_name}`,
  subtitle: customer.email,
  details: customer.company_name || customer.phone || '',
  url: `/customers/${customer.id}`,
  relevance
});

/**
 * Map a vehicle to a search result
 */
const mapVehicleToSearchResult = (vehicle: Vehicle, relevance: number): SearchResult => ({
  entity: EntityType.VEHICLE,
  id: vehicle.id,
  title: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
  subtitle: vehicle.vin,
  details: vehicle.notes || '',
  url: `/vehicles/${vehicle.id}`,
  relevance
});

/**
 * Search parts by query with tenant isolation
 */
const searchParts = async (
  tenantId: string,
  query: string,
  filters: SearchFilters,
  pagination: PaginationParams
): Promise<EntitySearchResults> => {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;
  
  // Build the where clause with tenant isolation
  const where: any = {
    tenant_id: tenantId,
    is_available: true
  };
  
  // Apply search criteria
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { part_number: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } }
    ];
  }
  
  // Apply filters
  if (filters.category) {
    where.category = { equals: filters.category, mode: 'insensitive' };
  }
  
  if (filters.condition) {
    where.condition = filters.condition;
  }
  
  // Execute query
  const [parts, totalCount] = await Promise.all([
    prisma.part.findMany({
      where,
      take: pageSize,
      skip,
      orderBy: { created_at: 'desc' }
    }),
    prisma.part.count({ where })
  ]);
  
  // Calculate relevance scores and map to search results
  const searchFields = [
    { field: 'name', weight: 40 },
    { field: 'part_number', weight: 30 },
    { field: 'category', weight: 20 },
    { field: 'description', weight: 10 }
  ];
  
  const results = parts.map(part => {
    const relevance = calculateRelevance(part, query, searchFields);
    return mapPartToSearchResult(part, relevance);
  });
  
  // Sort results by relevance score (descending)
  results.sort((a, b) => b.relevance - a.relevance);
  
  return {
    total: totalCount,
    results
  };
};

/**
 * Search customers by query with tenant isolation
 */
const searchCustomers = async (
  tenantId: string,
  query: string,
  filters: SearchFilters,
  pagination: PaginationParams
): Promise<EntitySearchResults> => {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;
  
  // Build the where clause with tenant isolation
  const where: any = {
    tenant_id: tenantId,
    is_active: true
  };
  
  // Apply search criteria
  if (query) {
    where.OR = [
      { first_name: { contains: query, mode: 'insensitive' } },
      { last_name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { company_name: { contains: query, mode: 'insensitive' } }
    ];
  }
  
  // Apply filters
  if (filters.customerType) {
    where.customer_type = filters.customerType;
  }
  
  // Execute query
  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      take: pageSize,
      skip,
      orderBy: { created_at: 'desc' }
    }),
    prisma.customer.count({ where })
  ]);
  
  // Calculate relevance scores and map to search results
  const searchFields = [
    { field: 'first_name', weight: 25 },
    { field: 'last_name', weight: 25 },
    { field: 'email', weight: 20 },
    { field: 'phone', weight: 15 },
    { field: 'company_name', weight: 15 }
  ];
  
  const results = customers.map(customer => {
    const relevance = calculateRelevance(customer, query, searchFields);
    return mapCustomerToSearchResult(customer, relevance);
  });
  
  // Sort results by relevance score (descending)
  results.sort((a, b) => b.relevance - a.relevance);
  
  return {
    total: totalCount,
    results
  };
};

/**
 * Search vehicles by query with tenant isolation
 */
const searchVehicles = async (
  tenantId: string,
  query: string,
  filters: SearchFilters,
  pagination: PaginationParams
): Promise<EntitySearchResults> => {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  const skip = (page - 1) * pageSize;
  
  // Build the where clause with tenant isolation
  const where: any = {
    tenant_id: tenantId,
    is_active: true
  };
  
  // Apply search criteria
  if (query) {
    where.OR = [
      { make: { contains: query, mode: 'insensitive' } },
      { model: { contains: query, mode: 'insensitive' } },
      { vin: { contains: query, mode: 'insensitive' } }
    ];
  }
  
  // Apply filters
  if (filters.vehicleMake) {
    where.make = { equals: filters.vehicleMake, mode: 'insensitive' };
  }
  
  if (filters.vehicleModel) {
    where.model = { equals: filters.vehicleModel, mode: 'insensitive' };
  }
  
  if (filters.minYear !== undefined) {
    where.year = { ...where.year, gte: filters.minYear };
  }
  
  if (filters.maxYear !== undefined) {
    where.year = { ...where.year, lte: filters.maxYear };
  }
  
  // Execute query
  const [vehicles, totalCount] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      take: pageSize,
      skip,
      orderBy: { created_at: 'desc' }
    }),
    prisma.vehicle.count({ where })
  ]);
  
  // Calculate relevance scores and map to search results
  const searchFields = [
    { field: 'make', weight: 35 },
    { field: 'model', weight: 35 },
    { field: 'vin', weight: 30 }
  ];
  
  const results = vehicles.map(vehicle => {
    const relevance = calculateRelevance(vehicle, query, searchFields);
    return mapVehicleToSearchResult(vehicle, relevance);
  });
  
  // Sort results by relevance score (descending)
  results.sort((a, b) => b.relevance - a.relevance);
  
  return {
    total: totalCount,
    results
  };
};

/**
 * Execute a global search across all entities
 */
export const globalSearch = async (
  tenantId: string,
  query: string,
  filters: SearchFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<SearchResponse> => {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  
  // Determine which entities to search based on filters
  const searchEntities = filters.entityTypes || Object.values(EntityType);
  const includeParts = searchEntities.includes(EntityType.PART);
  const includeCustomers = searchEntities.includes(EntityType.CUSTOMER);
  const includeVehicles = searchEntities.includes(EntityType.VEHICLE);
  
  // Execute searches in parallel
  const [partsResults, customersResults, vehiclesResults] = await Promise.all([
    includeParts ? searchParts(tenantId, query, filters, pagination) : Promise.resolve({ total: 0, results: [] }),
    includeCustomers ? searchCustomers(tenantId, query, filters, pagination) : Promise.resolve({ total: 0, results: [] }),
    includeVehicles ? searchVehicles(tenantId, query, filters, pagination) : Promise.resolve({ total: 0, results: [] })
  ]);
  
  // Calculate total results
  const totalResults = partsResults.total + customersResults.total + vehiclesResults.total;
  const totalPages = Math.ceil(totalResults / pageSize);
  
  logger.info('Global search executed', {
    tenantId,
    query,
    totalResults,
    partsCount: partsResults.total,
    customersCount: customersResults.total,
    vehiclesCount: vehiclesResults.total,
    userId
  });
  
  // Build response object
  const response: SearchResponse = {
    query,
    totalResults,
    pagination: {
      page,
      pageSize,
      totalPages
    }
  };
  
  // Add entity-specific results only if they have results
  if (includeParts) {
    response.parts = partsResults;
  }
  
  if (includeCustomers) {
    response.customers = customersResults;
  }
  
  if (includeVehicles) {
    response.vehicles = vehiclesResults;
  }
  
  return response;
};

/**
 * Search only parts
 */
export const searchPartsOnly = async (
  tenantId: string,
  query: string,
  filters: SearchFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<EntitySearchResults> => {
  logger.info('Parts search executed', { tenantId, query, userId });
  return searchParts(tenantId, query, filters, pagination);
};

/**
 * Search only customers
 */
export const searchCustomersOnly = async (
  tenantId: string,
  query: string,
  filters: SearchFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<EntitySearchResults> => {
  logger.info('Customers search executed', { tenantId, query, userId });
  return searchCustomers(tenantId, query, filters, pagination);
};

/**
 * Search only vehicles
 */
export const searchVehiclesOnly = async (
  tenantId: string,
  query: string,
  filters: SearchFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<EntitySearchResults> => {
  logger.info('Vehicles search executed', { tenantId, query, userId });
  return searchVehicles(tenantId, query, filters, pagination);
};

export default {
  globalSearch,
  searchPartsOnly,
  searchCustomersOnly,
  searchVehiclesOnly,
  EntityType
};