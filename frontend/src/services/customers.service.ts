/**
 * Customers Service
 * Handles all API calls related to customer management
 */

import axios, { AxiosError } from 'axios';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Customer type enum
 */
export type CustomerType = 'RETAIL' | 'TRADE' | 'WHOLESALE';

/**
 * Customer interface
 */
export interface Customer {
  id: string;
  tenant_id: string;
  customer_type: CustomerType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile?: string | null;
  abn?: string | null;
  company_name?: string | null;
  address?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    orders: number;
    quotes: number;
    communications?: number;
    warranty_claims?: number;
  };
  totalSpent?: number;
}

/**
 * Create customer data
 */
export interface CreateCustomerData {
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile?: string;
  abn?: string;
  companyName?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  notes?: string;
}

/**
 * Update customer data
 */
export interface UpdateCustomerData {
  customerType?: CustomerType;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  abn?: string;
  companyName?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Customers list filters
 */
export interface CustomersFilters {
  search?: string;
  customerType?: CustomerType;
  state?: string;
  postcode?: string;
  isActive?: boolean;
  hasOrders?: boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Customers response with pagination
 */
export interface CustomersResponse {
  data: Customer[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Customer statistics
 */
export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  retailCount: number;
  tradeCount: number;
  wholesaleCount: number;
  newThisMonth: number;
}

/**
 * Order interface (simplified)
 */
export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
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
 * Fetch customers with filters and pagination
 */
export const fetchCustomers = async (
  filters?: CustomersFilters,
  pagination?: PaginationParams
): Promise<CustomersResponse> => {
  try {
    const api = createApiClient();
    const params = {
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get('/customers', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Fetch single customer by ID
 */
export const fetchCustomerById = async (customerId: string): Promise<Customer> => {
  try {
    const api = createApiClient();
    const response = await api.get(`/customers/${customerId}`);
    return response.data.data.customer;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Create new customer
 */
export const createCustomer = async (customerData: CreateCustomerData): Promise<Customer> => {
  try {
    const api = createApiClient();
    const response = await api.post('/customers', customerData);
    return response.data.data.customer;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Update existing customer
 */
export const updateCustomer = async (
  customerId: string, 
  customerData: UpdateCustomerData
): Promise<Customer> => {
  try {
    const api = createApiClient();
    const response = await api.put(`/customers/${customerId}`, customerData);
    return response.data.data.customer;
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Delete customer (soft delete)
 */
export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    const api = createApiClient();
    await api.delete(`/customers/${customerId}`);
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Search customers with query
 */
export const searchCustomers = async (
  query: string,
  filters?: CustomersFilters,
  pagination?: PaginationParams
): Promise<CustomersResponse> => {
  try {
    const api = createApiClient();
    const params = {
      q: query,
      ...filters,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get('/customers/search', { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get customer's order history
 */
export const fetchCustomerOrders = async (
  customerId: string,
  pagination?: PaginationParams
): Promise<{ data: Order[]; meta: any }> => {
  try {
    const api = createApiClient();
    const params = {
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
    
    const response = await api.get(`/customers/${customerId}/orders`, { params });
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Get customer statistics
 */
export const fetchCustomerStats = async (): Promise<CustomerStats> => {
  try {
    const api = createApiClient();
    const response = await api.get('/customers/stats');
    return response.data.data.stats;
  } catch (error) {
    handleApiError(error);
  }
};

export default {
  fetchCustomers,
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  fetchCustomerOrders,
  fetchCustomerStats,
};