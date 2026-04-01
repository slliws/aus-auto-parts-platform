/**
 * Search Service
 * Handles API communication for global search functionality
 */

import apiService from './api.service';

/**
 * Entity type enum
 */
export enum EntityType {
  PART = 'part',
  CUSTOMER = 'customer',
  VEHICLE = 'vehicle'
}

/**
 * Interface for search result
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
 * Interface for entity-specific results
 */
export interface EntityResults {
  total: number;
  results: SearchResult[];
}

/**
 * Interface for search response
 */
export interface SearchResponse {
  query: string;
  totalResults: number;
  parts?: EntityResults;
  customers?: EntityResults;
  vehicles?: EntityResults;
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
 * Interface for pagination
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Convert filters to query parameters
 */
const filtersToQueryParams = (
  query: string,
  filters?: SearchFilters,
  pagination?: PaginationParams
): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Add query parameter
  if (query) params.append('query', query);
  
  // Add entity type filters
  if (filters?.entityTypes?.length) {
    params.append('entityTypes', filters.entityTypes.join(','));
  }
  
  // Add part filters
  if (filters?.category) params.append('category', filters.category);
  if (filters?.condition) params.append('condition', filters.condition);
  
  // Add customer filters
  if (filters?.customerType) params.append('customerType', filters.customerType);
  
  // Add vehicle filters
  if (filters?.vehicleMake) params.append('vehicleMake', filters.vehicleMake);
  if (filters?.vehicleModel) params.append('vehicleModel', filters.vehicleModel);
  if (filters?.minYear !== undefined) params.append('minYear', filters.minYear.toString());
  if (filters?.maxYear !== undefined) params.append('maxYear', filters.maxYear.toString());
  
  // Add pagination
  if (pagination?.page) params.append('page', pagination.page.toString());
  if (pagination?.pageSize) params.append('pageSize', pagination.pageSize.toString());
  
  return params;
};

/**
 * Search Service
 */
class SearchService {
  /**
   * Execute a global search across all entities
   */
  async globalSearch(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<SearchResponse> {
    try {
      const params = filtersToQueryParams(query, filters, pagination);
      const response = await apiService.get<SearchResponse>(`/search?${params.toString()}`);
      
      if (!response.data) {
        throw new Error('Invalid response format');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error performing global search:', error);
      throw error;
    }
  }
  
  /**
   * Search only parts
   */
  async searchParts(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<EntityResults> {
    try {
      const params = filtersToQueryParams(query, filters, pagination);
      const response = await apiService.get<{
        totalResults: number;
        results: SearchResult[];
        pagination: { page: number; pageSize: number; totalPages: number };
      }>(`/search/parts?${params.toString()}`);
      
      if (!response.data) {
        throw new Error('Invalid response format');
      }
      
      return {
        total: response.data.totalResults,
        results: response.data.results
      };
    } catch (error) {
      console.error('Error searching parts:', error);
      throw error;
    }
  }
  
  /**
   * Search only customers
   */
  async searchCustomers(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<EntityResults> {
    try {
      const params = filtersToQueryParams(query, filters, pagination);
      const response = await apiService.get<{
        totalResults: number;
        results: SearchResult[];
        pagination: { page: number; pageSize: number; totalPages: number };
      }>(`/search/customers?${params.toString()}`);
      
      if (!response.data) {
        throw new Error('Invalid response format');
      }
      
      return {
        total: response.data.totalResults,
        results: response.data.results
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
  
  /**
   * Search only vehicles
   */
  async searchVehicles(
    query: string,
    filters?: SearchFilters,
    pagination?: PaginationParams
  ): Promise<EntityResults> {
    try {
      const params = filtersToQueryParams(query, filters, pagination);
      const response = await apiService.get<{
        totalResults: number;
        results: SearchResult[];
        pagination: { page: number; pageSize: number; totalPages: number };
      }>(`/search/vehicles?${params.toString()}`);
      
      if (!response.data) {
        throw new Error('Invalid response format');
      }
      
      return {
        total: response.data.totalResults,
        results: response.data.results
      };
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  /**
   * Get entity-specific icon class
   */
  getEntityIconClass(entity: EntityType): string {
    switch (entity) {
      case EntityType.PART:
        return 'fa-cog';
      case EntityType.CUSTOMER:
        return 'fa-user';
      case EntityType.VEHICLE:
        return 'fa-car';
      default:
        return 'fa-search';
    }
  }
  
  /**
   * Get entity label
   */
  getEntityLabel(entity: EntityType): string {
    switch (entity) {
      case EntityType.PART:
        return 'Part';
      case EntityType.CUSTOMER:
        return 'Customer';
      case EntityType.VEHICLE:
        return 'Vehicle';
      default:
        return 'Unknown';
    }
  }
}

export default new SearchService();