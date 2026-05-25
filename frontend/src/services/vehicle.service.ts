/**
 * Vehicle Service
 * Handles all API calls related to vehicle management
 */

import axios, { AxiosError } from 'axios';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Vehicle interface
 */
export interface Vehicle {
  id: string;
  tenant_id: string;
  customer_id?: string | null;
  vin: string;
  registration_number?: string | null;
  make: string;
  model: string;
  year: number;
  engine_number?: string | null;
  transmission?: string | null;
  color?: string | null;
  location?: string | null; // Used for body_type
  fuel_type?: string | null;
  notes?: string | null;
  is_active: boolean;
  date_received: string;
  date_stripped?: string | null;
  created_at: string;
  updated_at: string;
  _count?: {
    parts: number;
  };
}

/**
 * VIN Decoder response
 */
export interface VehicleDetails {
  vin: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  engine?: string;
  transmission?: string;
  bodyType?: string;
  fuelType?: string;
  color?: string;
  manufacturingPlant?: string;
  manufacturingDate?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Create vehicle data
 */
export interface CreateVehicleData {
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
 * Update vehicle data
 */
export interface UpdateVehicleData {
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
 * Vehicles list filters
 */
export interface VehiclesFilters {
  search?: string;
  make?: string;
  model?: string;
  year?: number;
  customerId?: string;
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
 * Vehicles response with pagination
 */
export interface VehiclesResponse {
  data: Vehicle[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  meta?: any;
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
 * Fetch vehicles with filters and pagination
 */
export const fetchVehicles = async (
  filters?: VehiclesFilters,
  pagination?: PaginationParams
): Promise<VehiclesResponse> => {
  try {
    const api = createApiClient();
    const params = {
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get('/vehicles', { params });
    return {
      data: response.data.data?.vehicles ?? response.data.data ?? [],
      meta: response.data.meta ?? response.data.data?.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Fetch single vehicle by ID
 */
export const fetchVehicleById = async (vehicleId: string): Promise<Vehicle> => {
  try {
    const api = createApiClient();
    const response = await api.get(`/vehicles/${vehicleId}`);
    return response.data.data.vehicle;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create new vehicle
 */
export const createVehicle = async (vehicleData: CreateVehicleData): Promise<Vehicle> => {
  try {
    const api = createApiClient();
    const response = await api.post('/vehicles', vehicleData);
    return response.data.data.vehicle;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Update existing vehicle
 */
export const updateVehicle = async (
  vehicleId: string, 
  vehicleData: UpdateVehicleData
): Promise<Vehicle> => {
  try {
    const api = createApiClient();
    const response = await api.put(`/vehicles/${vehicleId}`, vehicleData);
    return response.data.data.vehicle;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Delete vehicle (soft delete)
 */
export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.delete(`/vehicles/${vehicleId}`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Search vehicles with query
 */
export const searchVehicles = async (
  query: string,
  filters?: VehiclesFilters,
  pagination?: PaginationParams
): Promise<VehiclesResponse> => {
  try {
    const api = createApiClient();
    const params = {
      q: query,
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get('/vehicles/search', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get customer's vehicles
 */
export const fetchCustomerVehicles = async (
  customerId: string,
  pagination?: PaginationParams
): Promise<VehiclesResponse> => {
  try {
    const api = createApiClient();
    const params = {
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get(`/vehicles/customer/${customerId}`, { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Decode VIN without saving
 */
export const decodeVin = async (vin: string): Promise<VehicleDetails> => {
  try {
    const api = createApiClient();
    const response = await api.post('/vehicles/decode-vin', { vin });
    return response.data.data.vehicleDetails;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get list of vehicle makes
 */
export const getVehicleMakes = async (): Promise<string[]> => {
  try {
    const api = createApiClient();
    const response = await api.get('/vehicles/makes');
    return response.data.data.makes;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get models for a specific make
 */
export const getModelsForMake = async (make: string): Promise<string[]> => {
  try {
    const api = createApiClient();
    const response = await api.get(`/vehicles/models/${make}`);
    return response.data.data.models;
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  fetchVehicles,
  fetchVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  fetchCustomerVehicles,
  decodeVin,
  getVehicleMakes,
  getModelsForMake,
};