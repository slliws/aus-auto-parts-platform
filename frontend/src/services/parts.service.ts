/**
 * Parts Service
 * Handles all API calls related to auto parts marketplace functionality
 */

import axios, { AxiosError } from 'axios';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Part Condition Enum
 */
export enum PartCondition {
  NEW = 'new',
  USED_EXCELLENT = 'used_excellent',
  USED_GOOD = 'used_good',
  USED_FAIR = 'used_fair',
  RECONDITIONED = 'reconditioned',
  DAMAGED = 'damaged'
}

/**
 * Part interface
 */
export interface Part {
  id: string;
  tenantId: string;
  partNumber: string;
  name: string;
  description: string | null;
  category: string;
  manufacturer: string | null;
  supplierPartNumber: string | null;
  location: string | null;
  quantityInStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  sellingPrice: number;
  markupPercentage: number;
  isActive: boolean;
  images?: string[];
  condition: PartCondition;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parts list filters
 */
export interface PartsFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: PartCondition;
  search?: string;
  manufacturer?: string;
  location?: string;
  isActive?: boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Parts response with pagination
 */
export interface PartsResponse {
  data: Part[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Category interface
 */
export interface Category {
  id: string;
  name: string;
  count: number;
  icon?: string;
}

/**
 * Search suggestion interface
 */
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'category';
}

/**
 * Favorite part interface
 */
export interface FavoritePart {
  id: string;
  partId: string;
  userId: string;
  createdAt: string;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * API error response
 */
interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Get tenant ID from localStorage
 */
const getTenantId = (): string | null => {
  return localStorage.getItem('tenantId');
};

/**
 * Create axios instance with auth headers
 */
const createApiClient = () => {
  const token = getAuthToken();
  const tenantId = getTenantId();
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(tenantId && { 'X-Tenant-ID': tenantId }),
    },
  });
};

/**
 * Handle API errors
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  throw new Error('An unexpected error occurred');
};

/**
 * Fetch parts with filters and pagination
 */
export const fetchParts = async (
  filters?: PartsFilters,
  pagination?: PaginationParams
): Promise<PartsResponse> => {
  try {
    const api = createApiClient();
    const params = {
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get('/parts', { params });
    // Backend returns { success: true, data: { parts: [...] }, meta: {...} }
    return {
      data: response.data.data.parts,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Fetch single part by ID
 */
export const fetchPartById = async (partId: string): Promise<Part> => {
  try {
    const api = createApiClient();
    const response = await api.get(`/parts/${partId}`);
    return response.data.data.part;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create new part
 */
export const createPart = async (partData: Partial<Part>): Promise<Part> => {
  try {
    const api = createApiClient();
    const response = await api.post('/parts', partData);
    return response.data.data.part;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Update existing part
 */
export const updatePart = async (partId: string, partData: Partial<Part>): Promise<Part> => {
  try {
    const api = createApiClient();
    const response = await api.put(`/parts/${partId}`, partData);
    return response.data.data.part;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Delete part (soft delete)
 */
export const deletePart = async (partId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.delete(`/parts/${partId}`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Search parts with query
 */
export const searchParts = async (
  query: string,
  filters?: PartsFilters,
  limit?: number
): Promise<Part[]> => {
  try {
    const api = createApiClient();
    const params = {
      q: query,
      ...filters,
      limit: limit || 20,
    };
    
    const response = await api.get('/parts/search', { params });
    return response.data.data.parts;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get low stock parts
 */
export const fetchLowStockParts = async (): Promise<Part[]> => {
  try {
    const api = createApiClient();
    const response = await api.get('/parts/low-stock');
    return response.data.data.parts;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get search suggestions (autocomplete)
 */
export const getSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<SearchSuggestion[]>>('/parts/search/suggestions', {
      params: { q: query },
    });
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Fetch all categories with counts
 */
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const api = createApiClient();
    const response = await api.get('/parts/categories');
    return response.data.data.categories;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Save/favorite a part
 */
export const savePart = async (partId: string): Promise<FavoritePart> => {
  try {
    const api = createApiClient();
    const response = await api.post<ApiResponse<FavoritePart>>('/parts/favorites', { partId });
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Remove part from favorites
 */
export const unsavePart = async (favoriteId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.delete(`/parts/favorites/${favoriteId}`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get user's favorite parts
 */
export const fetchFavoriteParts = async (): Promise<Part[]> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<Part[]>>('/parts/favorites');
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get parts by category
 */
export const fetchPartsByCategory = async (
  category: string,
  pagination?: PaginationParams
): Promise<PartsResponse> => {
  try {
    const api = createApiClient();
    const params = {
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get(`/parts/category/${category}`, { params });
    return {
      data: response.data.data.parts,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get recommended/similar parts
 */
export const fetchSimilarParts = async (partId: string, limit?: number): Promise<Part[]> => {
  try {
    const api = createApiClient();
    const response = await api.get<ApiResponse<Part[]>>(`/parts/${partId}/similar`, {
      params: { limit: limit || 4 },
    });
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get recently viewed parts (from localStorage)
 */
export const getRecentlyViewedParts = (): string[] => {
  try {
    const recentParts = localStorage.getItem('recentlyViewedParts');
    return recentParts ? JSON.parse(recentParts) : [];
  } catch (error) {
    console.error('Error reading recently viewed parts:', error);
    return [];
  }
};

/**
 * Add part to recently viewed (localStorage)
 */
export const addToRecentlyViewed = (partId: string): void => {
  try {
    const recentParts = getRecentlyViewedParts();
    const updatedParts = [partId, ...recentParts.filter(id => id !== partId)].slice(0, 10);
    localStorage.setItem('recentlyViewedParts', JSON.stringify(updatedParts));
  } catch (error) {
    console.error('Error saving recently viewed part:', error);
  }
};

/**
 * Get filter options (dynamic filter values from backend)
 */
export const fetchFilterOptions = async (): Promise<{
  categories: Category[];
  manufacturers: string[];
  locations: string[];
  priceRange: { min: number; max: number };
}> => {
  try {
    const api = createApiClient();
    const response = await api.get('/parts/filters/options');
    return response.data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  fetchParts,
  fetchPartById,
  createPart,
  updatePart,
  deletePart,
  searchParts,
  getSearchSuggestions,
  fetchCategories,
  fetchLowStockParts,
  savePart,
  unsavePart,
  fetchFavoriteParts,
  fetchPartsByCategory,
  fetchSimilarParts,
  getRecentlyViewedParts,
  addToRecentlyViewed,
  fetchFilterOptions,
};