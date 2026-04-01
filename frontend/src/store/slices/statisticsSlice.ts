import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import * as statisticsService from '../../services/statistics.service';
import type {
  DashboardStats,
  PartsStats,
  CustomersStats,
  OrdersStats,
  RevenueStats,
} from '../../services/statistics.service';
import { selectParts } from './partsSlice';
import { selectCustomers } from './customersSlice';

/**
 * Statistics State Interface
 * Manages dashboard metrics and analytics data
 */
interface StatisticsState {
  dashboardStats: DashboardStats | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  lastUpdated: string | null;
}

const initialState: StatisticsState = {
  dashboardStats: null,
  loading: 'idle',
  error: null,
  lastUpdated: null,
};

/**
 * Async Thunk: Fetch Dashboard Statistics
 * Retrieves all dashboard statistics from API
 */
export const fetchDashboardStats = createAsyncThunk(
  'statistics/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await statisticsService.fetchDashboardStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard statistics');
    }
  }
);

/**
 * Async Thunk: Fetch Parts Statistics
 */
export const fetchPartsStats = createAsyncThunk(
  'statistics/fetchPartsStats',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const stats = await statisticsService.fetchPartsStats();
      
      // Update only the parts section of dashboard stats
      const state = getState() as RootState;
      const currentStats = state.statistics.dashboardStats;
      
      if (currentStats) {
        dispatch(updatePartialStats({
          key: 'parts',
          value: stats,
        }));
      }
      
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch parts statistics');
    }
  }
);

/**
 * Async Thunk: Fetch Customers Statistics
 */
export const fetchCustomersStats = createAsyncThunk(
  'statistics/fetchCustomersStats',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const stats = await statisticsService.fetchCustomersStats();
      
      // Update only the customers section of dashboard stats
      const state = getState() as RootState;
      const currentStats = state.statistics.dashboardStats;
      
      if (currentStats) {
        dispatch(updatePartialStats({
          key: 'customers',
          value: stats,
        }));
      }
      
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch customer statistics');
    }
  }
);

/**
 * Async Thunk: Calculate Local Statistics
 * Used when API endpoints are not available
 */
export const calculateLocalStats = createAsyncThunk(
  'statistics/calculateLocalStats',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const parts = selectParts(state);
    const customers = selectCustomers(state);
    
    const stats = statisticsService.calculateLocalStats(parts, customers);
    return stats;
  }
);

const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    updatePartialStats: (
      state, 
      action: PayloadAction<{ 
        key: 'parts' | 'customers' | 'orders' | 'revenue'; 
        value: PartsStats | CustomersStats | OrdersStats | RevenueStats 
      }>
    ) => {
      if (state.dashboardStats) {
        state.dashboardStats = {
          ...state.dashboardStats,
          [action.payload.key]: action.payload.value,
        };
      }
    },
    clearStatistics: (state) => {
      state.dashboardStats = null;
      state.loading = 'idle';
      state.error = null;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Stats
    builder.addCase(fetchDashboardStats.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchDashboardStats.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.dashboardStats = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    });
    builder.addCase(fetchDashboardStats.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
    
    // Calculate Local Stats
    builder.addCase(calculateLocalStats.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(calculateLocalStats.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.dashboardStats = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    });
  },
});

// Actions
export const { updatePartialStats, clearStatistics, resetError } = statisticsSlice.actions;

// Selectors
export const selectDashboardStats = (state: RootState) => state.statistics.dashboardStats;
export const selectStatisticsLoading = (state: RootState) => state.statistics.loading;
export const selectStatisticsError = (state: RootState) => state.statistics.error;
export const selectLastUpdated = (state: RootState) => state.statistics.lastUpdated;
export const selectPartsStats = (state: RootState) => state.statistics.dashboardStats?.parts;
export const selectCustomersStats = (state: RootState) => state.statistics.dashboardStats?.customers;
export const selectOrdersStats = (state: RootState) => state.statistics.dashboardStats?.orders;
export const selectRevenueStats = (state: RootState) => state.statistics.dashboardStats?.revenue;

export default statisticsSlice.reducer;