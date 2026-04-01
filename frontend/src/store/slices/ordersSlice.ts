import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

/**
 * Orders State Interface
 * Manages quotes, orders, and sales workflow
 */
interface OrderItem {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface Quote {
  id: string;
  tenantId: string;
  quoteNumber: string;
  customerId: string;
  vehicleId: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  validUntil: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  quoteId: string | null;
  customerId: string;
  vehicleId: string | null;
  status: 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  quotes: Quote[];
  currentQuote: Quote | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  ordersPagination: PaginationMeta;
  quotesPagination: PaginationMeta;
  filters: OrderFilters;
}

interface FetchOrdersParams {
  page?: number;
  limit?: number;
  filters?: OrderFilters;
}

interface FetchOrdersResponse {
  data: Order[];
  meta: PaginationMeta;
}

interface FetchQuotesResponse {
  data: Quote[];
  meta: PaginationMeta;
}

interface CreateQuotePayload {
  customerId: string;
  vehicleId?: string;
  items: Array<{
    partId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  notes?: string;
  validUntil: string;
}

interface UpdateQuotePayload {
  id: string;
  data: Partial<Omit<Quote, 'id' | 'tenantId' | 'quoteNumber' | 'createdAt' | 'updatedAt'>>;
}

interface CreateOrderPayload {
  customerId: string;
  vehicleId?: string;
  quoteId?: string;
  items: Array<{
    partId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  notes?: string;
}

interface UpdateOrderPayload {
  id: string;
  data: Partial<Omit<Order, 'id' | 'tenantId' | 'orderNumber' | 'createdAt' | 'updatedAt'>>;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  quotes: [],
  currentQuote: null,
  loading: 'idle',
  error: null,
  ordersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  quotesPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
};

/**
 * Async Thunk: Fetch Orders
 * Retrieves paginated orders list with filtering
 */
export const fetchOrders = createAsyncThunk<FetchOrdersResponse, FetchOrdersParams>(
  'orders/fetchOrders',
  async (params, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to GET /api/v1/orders
      // const response = await ordersAPI.getOrders(params);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

/**
 * Async Thunk: Fetch Quotes
 * Retrieves paginated quotes list
 */
export const fetchQuotes = createAsyncThunk<FetchQuotesResponse, FetchOrdersParams>(
  'orders/fetchQuotes',
  async (params, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to GET /api/v1/quotes
      // const response = await ordersAPI.getQuotes(params);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quotes');
    }
  }
);

/**
 * Async Thunk: Create Quote
 * Creates new customer quote
 */
export const createQuote = createAsyncThunk<Quote, CreateQuotePayload>(
  'orders/createQuote',
  async (quoteData, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to POST /api/v1/quotes
      // const response = await ordersAPI.createQuote(quoteData);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create quote');
    }
  }
);

/**
 * Async Thunk: Update Quote
 * Updates existing quote details
 */
export const updateQuote = createAsyncThunk<Quote, UpdateQuotePayload>(
  'orders/updateQuote',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to PUT /api/v1/quotes/:id
      // const response = await ordersAPI.updateQuote(id, data);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update quote');
    }
  }
);

/**
 * Async Thunk: Convert Quote to Order
 * Creates order from accepted quote
 */
export const convertQuoteToOrder = createAsyncThunk<Order, string>(
  'orders/convertQuoteToOrder',
  async (quoteId, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to POST /api/v1/quotes/:id/convert
      // const response = await ordersAPI.convertQuoteToOrder(quoteId);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to convert quote to order');
    }
  }
);

/**
 * Async Thunk: Create Order
 * Creates new order directly (without quote)
 */
export const createOrder = createAsyncThunk<Order, CreateOrderPayload>(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to POST /api/v1/orders
      // const response = await ordersAPI.createOrder(orderData);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

/**
 * Async Thunk: Update Order
 * Updates existing order details or status
 */
export const updateOrder = createAsyncThunk<Order, UpdateOrderPayload>(
  'orders/updateOrder',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to PUT /api/v1/orders/:id
      // const response = await ordersAPI.updateOrder(id, data);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

/**
 * Async Thunk: Fetch Order by ID
 * Retrieves single order with full details
 */
export const fetchOrderById = createAsyncThunk<Order, string>(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to GET /api/v1/orders/:id
      // const response = await ordersAPI.getOrderById(orderId);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

/**
 * Async Thunk: Fetch Quote by ID
 * Retrieves single quote with full details
 */
export const fetchQuoteById = createAsyncThunk<Quote, string>(
  'orders/fetchQuoteById',
  async (quoteId, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to GET /api/v1/quotes/:id
      // const response = await ordersAPI.getQuoteById(quoteId);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quote');
    }
  }
);

/**
 * Async Thunk: Cancel Order
 * Cancels order and restores inventory
 */
export const cancelOrder = createAsyncThunk<Order, string>(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to POST /api/v1/orders/:id/cancel
      // const response = await ordersAPI.cancelOrder(orderId);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    setCurrentQuote: (state, action: PayloadAction<Quote | null>) => {
      state.currentQuote = action.payload;
    },
    setOrderFilters: (state, action: PayloadAction<OrderFilters>) => {
      state.filters = action.payload;
    },
    clearOrderFilters: (state) => {
      state.filters = {};
    },
    clearOrdersError: (state) => {
      state.error = null;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.quotes = [];
      state.currentQuote = null;
      state.ordersPagination = initialState.ordersPagination;
      state.quotesPagination = initialState.quotesPagination;
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder.addCase(fetchOrders.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.orders = action.payload.data;
      state.ordersPagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchOrders.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Quotes
    builder.addCase(fetchQuotes.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchQuotes.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.quotes = action.payload.data;
      state.quotesPagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchQuotes.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Create Quote
    builder.addCase(createQuote.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(createQuote.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.quotes.unshift(action.payload);
      state.quotesPagination.totalItems += 1;
      state.error = null;
    });
    builder.addCase(createQuote.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update Quote
    builder.addCase(updateQuote.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateQuote.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.quotes.findIndex(quote => quote.id === action.payload.id);
      if (index !== -1) {
        state.quotes[index] = action.payload;
      }
      if (state.currentQuote?.id === action.payload.id) {
        state.currentQuote = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateQuote.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Convert Quote to Order
    builder.addCase(convertQuoteToOrder.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(convertQuoteToOrder.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.orders.unshift(action.payload);
      state.ordersPagination.totalItems += 1;
      // Update quote status to ACCEPTED
      if (action.payload.quoteId) {
        const quoteIndex = state.quotes.findIndex(quote => quote.id === action.payload.quoteId);
        if (quoteIndex !== -1) {
          state.quotes[quoteIndex].status = 'ACCEPTED';
        }
      }
      state.error = null;
    });
    builder.addCase(convertQuoteToOrder.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Create Order
    builder.addCase(createOrder.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.orders.unshift(action.payload);
      state.ordersPagination.totalItems += 1;
      state.error = null;
    });
    builder.addCase(createOrder.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update Order
    builder.addCase(updateOrder.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateOrder.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateOrder.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Order by ID
    builder.addCase(fetchOrderById.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchOrderById.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.currentOrder = action.payload;
      state.error = null;
    });
    builder.addCase(fetchOrderById.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Quote by ID
    builder.addCase(fetchQuoteById.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchQuoteById.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.currentQuote = action.payload;
      state.error = null;
    });
    builder.addCase(fetchQuoteById.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Cancel Order
    builder.addCase(cancelOrder.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
      state.error = null;
    });
    builder.addCase(cancelOrder.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
  },
});

// Actions
export const {
  setCurrentOrder,
  setCurrentQuote,
  setOrderFilters,
  clearOrderFilters,
  clearOrdersError,
  clearOrders,
} = ordersSlice.actions;

// Selectors
export const selectOrders = (state: RootState) => state.orders.orders;
export const selectCurrentOrder = (state: RootState) => state.orders.currentOrder;
export const selectQuotes = (state: RootState) => state.orders.quotes;
export const selectCurrentQuote = (state: RootState) => state.orders.currentQuote;
export const selectOrdersLoading = (state: RootState) => state.orders.loading;
export const selectOrdersError = (state: RootState) => state.orders.error;
export const selectOrdersPagination = (state: RootState) => state.orders.ordersPagination;
export const selectQuotesPagination = (state: RootState) => state.orders.quotesPagination;
export const selectOrderFilters = (state: RootState) => state.orders.filters;
export const selectOrderById = (state: RootState, orderId: string) =>
  state.orders.orders.find(order => order.id === orderId);
export const selectQuoteById = (state: RootState, quoteId: string) =>
  state.orders.quotes.find(quote => quote.id === quoteId);
export const selectOrdersByStatus = (state: RootState, status: string) =>
  state.orders.orders.filter(order => order.status === status);
export const selectQuotesByStatus = (state: RootState, status: string) =>
  state.orders.quotes.filter(quote => quote.status === status);

export default ordersSlice.reducer;