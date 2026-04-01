import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import * as customersService from '../../services/customers.service';
import type {
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  CustomersFilters,
  PaginationParams,
  CustomerStats,
  Order,
} from '../../services/customers.service';

/**
 * Customers State Interface
 * Manages customer records, communications, and related data
 */

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface CustomersState {
  customers: Customer[];
  currentCustomer: Customer | null;
  customerOrders: Order[];
  stats: CustomerStats | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  pagination: PaginationMeta;
  filters: CustomersFilters;
}

interface FetchCustomersParams {
  page?: number;
  limit?: number;
  filters?: CustomersFilters;
}

const initialState: CustomersState = {
  customers: [],
  currentCustomer: null,
  customerOrders: [],
  stats: null,
  loading: 'idle',
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
};

/**
 * Async Thunk: Fetch Customers
 * Retrieves paginated list of customers with filtering
 */
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params: FetchCustomersParams = {}, { rejectWithValue }) => {
    try {
      const { page, limit, filters } = params;
      const response = await customersService.fetchCustomers(
        filters,
        { page, limit }
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch customers');
    }
  }
);

/**
 * Async Thunk: Create Customer
 * Creates new customer record
 */
export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData: CreateCustomerData, { rejectWithValue }) => {
    try {
      const customer = await customersService.createCustomer(customerData);
      return customer;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create customer');
    }
  }
);

/**
 * Async Thunk: Update Customer
 * Updates existing customer details
 */
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, data }: { id: string; data: UpdateCustomerData }, { rejectWithValue }) => {
    try {
      const customer = await customersService.updateCustomer(id, data);
      return customer;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update customer');
    }
  }
);

/**
 * Async Thunk: Delete Customer
 * Soft deletes customer (sets is_active to false)
 */
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (customerId: string, { rejectWithValue }) => {
    try {
      await customersService.deleteCustomer(customerId);
      return customerId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete customer');
    }
  }
);

/**
 * Async Thunk: Fetch Customer by ID
 * Retrieves single customer with full details
 */
export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const customer = await customersService.fetchCustomerById(customerId);
      return customer;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch customer');
    }
  }
);

/**
 * Async Thunk: Fetch Customer Orders
 * Retrieves order history for specific customer
 */
export const fetchCustomerOrders = createAsyncThunk(
  'customers/fetchCustomerOrders',
  async ({ customerId, pagination }: { customerId: string; pagination?: PaginationParams }, { rejectWithValue }) => {
    try {
      const response = await customersService.fetchCustomerOrders(customerId, pagination);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch customer orders');
    }
  }
);

/**
 * Async Thunk: Search Customers
 * Search customers by query string
 */
export const searchCustomers = createAsyncThunk(
  'customers/searchCustomers',
  async ({ query, filters, pagination }: { query: string; filters?: CustomersFilters; pagination?: PaginationParams }, { rejectWithValue }) => {
    try {
      const response = await customersService.searchCustomers(query, filters, pagination);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search customers');
    }
  }
);

/**
 * Async Thunk: Fetch Customer Statistics
 * Get aggregate customer statistics
 */
export const fetchCustomerStats = createAsyncThunk(
  'customers/fetchCustomerStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await customersService.fetchCustomerStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch customer statistics');
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setCurrentCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.currentCustomer = action.payload;
    },
    setCustomerFilters: (state, action: PayloadAction<CustomersFilters>) => {
      state.filters = action.payload;
    },
    clearCustomerFilters: (state) => {
      state.filters = {};
    },
    clearCustomersError: (state) => {
      state.error = null;
    },
    clearCustomers: (state) => {
      state.customers = [];
      state.currentCustomer = null;
      state.customerOrders = [];
      state.stats = null;
      state.pagination = initialState.pagination;
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Customers
    builder.addCase(fetchCustomers.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.customers = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Create Customer
    builder.addCase(createCustomer.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.customers.unshift(action.payload);
      state.pagination.totalItems += 1;
      state.error = null;
    });
    builder.addCase(createCustomer.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update Customer
    builder.addCase(updateCustomer.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.customers.findIndex(customer => customer.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
      if (state.currentCustomer?.id === action.payload.id) {
        state.currentCustomer = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateCustomer.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Delete Customer
    builder.addCase(deleteCustomer.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.customers = state.customers.filter(customer => customer.id !== action.payload);
      if (state.currentCustomer?.id === action.payload) {
        state.currentCustomer = null;
      }
      state.pagination.totalItems -= 1;
      state.error = null;
    });
    builder.addCase(deleteCustomer.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Customer by ID
    builder.addCase(fetchCustomerById.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchCustomerById.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.currentCustomer = action.payload;
      state.error = null;
    });
    builder.addCase(fetchCustomerById.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Customer Orders
    builder.addCase(fetchCustomerOrders.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchCustomerOrders.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.customerOrders = action.payload;
      state.error = null;
    });
    builder.addCase(fetchCustomerOrders.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Search Customers
    builder.addCase(searchCustomers.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(searchCustomers.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.customers = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(searchCustomers.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Customer Stats
    builder.addCase(fetchCustomerStats.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchCustomerStats.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.stats = action.payload;
      state.error = null;
    });
    builder.addCase(fetchCustomerStats.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
  },
});

// Actions
export const {
  setCurrentCustomer,
  setCustomerFilters,
  clearCustomerFilters,
  clearCustomersError,
  clearCustomers,
} = customersSlice.actions;

// Selectors
export const selectCustomers = (state: RootState) => state.customers.customers;
export const selectCurrentCustomer = (state: RootState) => state.customers.currentCustomer;
export const selectCustomerOrders = (state: RootState) => state.customers.customerOrders;
export const selectCustomerStats = (state: RootState) => state.customers.stats;
export const selectCustomersLoading = (state: RootState) => state.customers.loading;
export const selectCustomersError = (state: RootState) => state.customers.error;
export const selectCustomersPagination = (state: RootState) => state.customers.pagination;
export const selectCustomerFilters = (state: RootState) => state.customers.filters;
export const selectCustomerById = (state: RootState, customerId: string) =>
  state.customers.customers.find(customer => customer.id === customerId);

export default customersSlice.reducer;