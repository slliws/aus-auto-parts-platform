import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import paymentService, {
  Payment,
  PaymentMethod,
  CreatePaymentRequest,
  RefundPaymentRequest,
  SavePaymentMethodRequest,
  PaymentStatusResponse,
} from '../../services/payment.service';

// ============================================================================
// INTERFACES
// ============================================================================

interface PaymentsState {
  payments: Payment[];
  currentPayment: Payment | null;
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  processingPayment: boolean;
  refundingPayment: boolean;
  savingPaymentMethod: boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PaymentsState = {
  payments: [],
  currentPayment: null,
  paymentMethods: [],
  loading: false,
  error: null,
  processingPayment: false,
  refundingPayment: false,
  savingPaymentMethod: false,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Create a new payment
 */
export const createPayment = createAsyncThunk(
  'payments/create',
  async (data: CreatePaymentRequest, { rejectWithValue }) => {
    try {
      const payment = await paymentService.createPayment(data);
      return payment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment');
    }
  }
);

/**
 * Create and process a payment immediately
 */
export const createAndProcessPayment = createAsyncThunk(
  'payments/createAndProcess',
  async (data: CreatePaymentRequest, { rejectWithValue }) => {
    try {
      const result = await paymentService.createAndProcessPayment(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create and process payment');
    }
  }
);

/**
 * Process a pending payment
 */
export const processPayment = createAsyncThunk(
  'payments/process',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const result = await paymentService.processPayment(paymentId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process payment');
    }
  }
);

/**
 * Refund a payment
 */
export const refundPayment = createAsyncThunk(
  'payments/refund',
  async ({ paymentId, data }: { paymentId: string; data: RefundPaymentRequest }, { rejectWithValue }) => {
    try {
      const result = await paymentService.refundPayment(paymentId, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refund payment');
    }
  }
);

/**
 * Get payment by ID
 */
export const getPayment = createAsyncThunk(
  'payments/getById',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const payment = await paymentService.getPayment(paymentId);
      return payment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get payment');
    }
  }
);

/**
 * Get payments for an order
 */
export const getOrderPayments = createAsyncThunk(
  'payments/getByOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const payments = await paymentService.getOrderPayments(orderId);
      return payments;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get order payments');
    }
  }
);

/**
 * Check payment status
 */
export const checkPaymentStatus = createAsyncThunk(
  'payments/checkStatus',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const status = await paymentService.checkPaymentStatus(paymentId);
      return status;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check payment status');
    }
  }
);

/**
 * Save a customer payment method
 */
export const savePaymentMethod = createAsyncThunk(
  'payments/saveMethod',
  async (data: SavePaymentMethodRequest, { rejectWithValue }) => {
    try {
      const paymentMethod = await paymentService.savePaymentMethod(data);
      return paymentMethod;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save payment method');
    }
  }
);

/**
 * Get customer payment methods
 */
export const getCustomerPaymentMethods = createAsyncThunk(
  'payments/getCustomerMethods',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const methods = await paymentService.getCustomerPaymentMethods(customerId);
      return methods;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get payment methods');
    }
  }
);

/**
 * Delete a payment method
 */
export const deletePaymentMethod = createAsyncThunk(
  'payments/deleteMethod',
  async (paymentMethodId: string, { rejectWithValue }) => {
    try {
      await paymentService.deletePaymentMethod(paymentMethodId);
      return paymentMethodId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete payment method');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    setCurrentPayment: (state, action: PayloadAction<Payment>) => {
      state.currentPayment = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create payment
    builder
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.unshift(action.payload);
        state.currentPayment = action.payload;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create and process payment
    builder
      .addCase(createAndProcessPayment.pending, (state) => {
        state.loading = true;
        state.processingPayment = true;
        state.error = null;
      })
      .addCase(createAndProcessPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.processingPayment = false;
        if (action.payload.payment) {
          state.payments.unshift(action.payload.payment);
          state.currentPayment = action.payload.payment;
        }
      })
      .addCase(createAndProcessPayment.rejected, (state, action) => {
        state.loading = false;
        state.processingPayment = false;
        state.error = action.payload as string;
      });

    // Process payment
    builder
      .addCase(processPayment.pending, (state) => {
        state.processingPayment = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.processingPayment = false;
        if (action.payload.payment) {
          const index = state.payments.findIndex(p => p.id === action.payload.payment.id);
          if (index !== -1) {
            state.payments[index] = action.payload.payment;
          }
          state.currentPayment = action.payload.payment;
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.processingPayment = false;
        state.error = action.payload as string;
      });

    // Refund payment
    builder
      .addCase(refundPayment.pending, (state) => {
        state.refundingPayment = true;
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.refundingPayment = false;
        if (action.payload.payment) {
          const index = state.payments.findIndex(p => p.id === action.payload.payment.id);
          if (index !== -1) {
            state.payments[index] = action.payload.payment;
          }
          state.currentPayment = action.payload.payment;
        }
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.refundingPayment = false;
        state.error = action.payload as string;
      });

    // Get payment
    builder
      .addCase(getPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
      })
      .addCase(getPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get order payments
    builder
      .addCase(getOrderPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(getOrderPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Check payment status
    builder
      .addCase(checkPaymentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkPaymentStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Save payment method
    builder
      .addCase(savePaymentMethod.pending, (state) => {
        state.savingPaymentMethod = true;
        state.error = null;
      })
      .addCase(savePaymentMethod.fulfilled, (state, action) => {
        state.savingPaymentMethod = false;
        state.paymentMethods.unshift(action.payload);
      })
      .addCase(savePaymentMethod.rejected, (state, action) => {
        state.savingPaymentMethod = false;
        state.error = action.payload as string;
      });

    // Get customer payment methods
    builder
      .addCase(getCustomerPaymentMethods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomerPaymentMethods.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = action.payload;
      })
      .addCase(getCustomerPaymentMethods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete payment method
    builder
      .addCase(deletePaymentMethod.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMethods = state.paymentMethods.filter(
          (method) => method.id !== action.payload
        );
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentPayment, setCurrentPayment } = paymentsSlice.actions;
export default paymentsSlice.reducer;