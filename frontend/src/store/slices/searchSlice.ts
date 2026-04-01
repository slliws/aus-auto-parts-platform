/**
 * Search Slice
 * Manages global search state for the application
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import searchService, { 
  SearchResult, 
  EntityType, 
  SearchFilters, 
  PaginationParams,
  SearchResponse 
} from '../../services/search.service';

/**
 * Search State Interface
 * Manages search functionality, results, and UI state
 */
interface SearchState {
  query: string;
  results: {
    parts: SearchResult[];
    customers: SearchResult[];
    vehicles: SearchResult[];
    all: SearchResult[]; // Combined results for quick search
  };
  totals: {
    parts: number;
    customers: number;
    vehicles: number;
    all: number;
  };
  filters: SearchFilters;
  activeEntityType: EntityType | 'all';
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  recentSearches: string[];
  searchHistory: Array<{
    query: string;
    timestamp: number;
    resultCount: number;
  }>;
  suggestions: string[];
}

// Parameters for search actions
interface SearchParams {
  query: string;
  filters?: SearchFilters;
  pagination?: PaginationParams;
}

const initialState: SearchState = {
  query: '',
  results: {
    parts: [],
    customers: [],
    vehicles: [],
    all: []
  },
  totals: {
    parts: 0,
    customers: 0,
    vehicles: 0,
    all: 0
  },
  filters: {},
  activeEntityType: 'all',
  loading: 'idle',
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    totalPages: 1
  },
  recentSearches: [],
  searchHistory: [],
  suggestions: []
};

/**
 * Async Thunk: Global Search
 * Searches across all entities (parts, customers, vehicles)
 */
export const performGlobalSearch = createAsyncThunk<SearchResponse, SearchParams>(
  'search/performGlobalSearch',
  async ({ query, filters, pagination }, { rejectWithValue }) => {
    try {
      const response = await searchService.globalSearch(query, filters, pagination);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform search');
    }
  }
);

/**
 * Async Thunk: Perform Quick Search (for autocomplete/header search)
 */
export const performQuickSearch = createAsyncThunk<SearchResponse, { query: string, limit: number }>(
  'search/performQuickSearch',
  async ({ query, limit }, { rejectWithValue }) => {
    try {
      const pagination = { page: 1, limit };
      const response = await searchService.globalSearch(query, {}, pagination);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to perform quick search');
    }
  }
);

/**
 * Async Thunk: Search Parts Only
 * Searches only in the parts inventory
 */
export const searchParts = createAsyncThunk<SearchResult[], SearchParams>(
  'search/searchParts',
  async ({ query, filters, pagination }, { rejectWithValue }) => {
    try {
      const response = await searchService.searchParts(query, filters, pagination);
      return response.results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search parts');
    }
  }
);

/**
 * Async Thunk: Search Customers Only
 * Searches only in the customer database
 */
export const searchCustomers = createAsyncThunk<SearchResult[], SearchParams>(
  'search/searchCustomers',
  async ({ query, filters, pagination }, { rejectWithValue }) => {
    try {
      const response = await searchService.searchCustomers(query, filters, pagination);
      return response.results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search customers');
    }
  }
);

/**
 * Async Thunk: Search Vehicles Only
 * Searches only in the vehicles database
 */
export const searchVehicles = createAsyncThunk<SearchResult[], SearchParams>(
  'search/searchVehicles',
  async ({ query, filters, pagination }, { rejectWithValue }) => {
    try {
      const response = await searchService.searchVehicles(query, filters, pagination);
      return response.results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search vehicles');
    }
  }
);

// Helper function to store search in history
const addToSearchHistory = (
  state: SearchState,
  query: string,
  resultCount: number
) => {
  // Only store non-empty queries
  if (!query.trim()) return;
  
  // Add to recent searches (max 10, no duplicates)
  if (!state.recentSearches.includes(query)) {
    state.recentSearches = [query, ...state.recentSearches.slice(0, 9)];
  }
  
  // Add to search history
  state.searchHistory = [
    {
      query,
      timestamp: Date.now(),
      resultCount
    },
    ...state.searchHistory.slice(0, 19) // Keep last 20 searches
  ];
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setSearchFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
    },
    setActiveEntityType: (state, action: PayloadAction<EntityType | 'all'>) => {
      state.activeEntityType = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.results.parts = [];
      state.results.customers = [];
      state.results.vehicles = [];
      state.results.all = [];
      state.error = null;
    },
    clearSearchFilters: (state) => {
      state.filters = {};
    },
    clearSearchResults: (state) => {
      state.results.parts = [];
      state.results.customers = [];
      state.results.vehicles = [];
      state.results.all = [];
    },
    clearSearchError: (state) => {
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    setSuggestions: (state, action: PayloadAction<string[]>) => {
      state.suggestions = action.payload;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    }
  },
  extraReducers: (builder) => {
    // Global Search
    builder.addCase(performGlobalSearch.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(performGlobalSearch.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      
      // Update query and pagination info
      state.query = action.payload.query;
      state.pagination = action.payload.pagination;
      
      // Update results by entity type
      if (action.payload.parts) {
        state.results.parts = action.payload.parts.results;
        state.totals.parts = action.payload.parts.total;
      } else {
        state.results.parts = [];
        state.totals.parts = 0;
      }
      
      if (action.payload.customers) {
        state.results.customers = action.payload.customers.results;
        state.totals.customers = action.payload.customers.total;
      } else {
        state.results.customers = [];
        state.totals.customers = 0;
      }
      
      if (action.payload.vehicles) {
        state.results.vehicles = action.payload.vehicles.results;
        state.totals.vehicles = action.payload.vehicles.total;
      } else {
        state.results.vehicles = [];
        state.totals.vehicles = 0;
      }
      
      // Create combined results sorted by relevance
      const allResults = [
        ...state.results.parts,
        ...state.results.customers,
        ...state.results.vehicles
      ];
      
      // Sort by relevance (descending)
      state.results.all = allResults.sort((a, b) => b.relevance - a.relevance);
      
      // Update total count
      state.totals.all = action.payload.totalResults;
      
      // Add search to history
      addToSearchHistory(state, action.payload.query, action.payload.totalResults);
      
      state.error = null;
    });
    builder.addCase(performGlobalSearch.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Quick Search (reusing global search logic to update results)
    builder.addCase(performQuickSearch.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(performQuickSearch.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      
      // Update query info but NOT pagination (quick search doesn't change page)
      state.query = action.payload.query;
      
      // Update results similar to global search
      if (action.payload.parts) {
        state.results.parts = action.payload.parts.results;
        state.totals.parts = action.payload.parts.total;
      }
      if (action.payload.customers) {
        state.results.customers = action.payload.customers.results;
        state.totals.customers = action.payload.customers.total;
      }
      if (action.payload.vehicles) {
        state.results.vehicles = action.payload.vehicles.results;
        state.totals.vehicles = action.payload.vehicles.total;
      }
      
      const allResults = [
        ...(state.results.parts || []),
        ...(state.results.customers || []),
        ...(state.results.vehicles || [])
      ];
      state.results.all = allResults.sort((a, b) => b.relevance - a.relevance);
      state.totals.all = action.payload.totalResults;
      state.error = null;
    });
    builder.addCase(performQuickSearch.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Search Parts
    builder.addCase(searchParts.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(searchParts.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.results.parts = action.payload;
      state.results.all = [...action.payload, ...state.results.customers, ...state.results.vehicles]
        .sort((a, b) => b.relevance - a.relevance);
      state.error = null;
    });
    builder.addCase(searchParts.rejected, (state, action) => {
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
      state.results.customers = action.payload;
      state.results.all = [...state.results.parts, ...action.payload, ...state.results.vehicles]
        .sort((a, b) => b.relevance - a.relevance);
      state.error = null;
    });
    builder.addCase(searchCustomers.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Search Vehicles
    builder.addCase(searchVehicles.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(searchVehicles.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.results.vehicles = action.payload;
      state.results.all = [...state.results.parts, ...state.results.customers, ...action.payload]
        .sort((a, b) => b.relevance - a.relevance);
      state.error = null;
    });
    builder.addCase(searchVehicles.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
  },
});

// Actions
export const {
  setSearchQuery,
  setSearchFilters,
  setActiveEntityType,
  clearSearch,
  clearSearchFilters,
  clearSearchResults,
  clearSearchError,
  setPage,
  setPageSize,
  clearRecentSearches,
  setSuggestions,
  clearSuggestions
} = searchSlice.actions;

// Selectors
export const selectSearchQuery = (state: RootState) => state.search.query;
export const selectSearchResults = (state: RootState) => state.search.results;
export const selectResultTotals = (state: RootState) => state.search.totals;
export const selectSearchLoading = (state: RootState) => state.search.loading;
export const selectSearchError = (state: RootState) => state.search.error;
export const selectSearchFilters = (state: RootState) => state.search.filters;
export const selectActiveEntityType = (state: RootState) => state.search.activeEntityType;
export const selectSearchPagination = (state: RootState) => state.search.pagination;
export const selectRecentSearches = (state: RootState) => state.search.recentSearches;
export const selectSearchHistory = (state: RootState) => state.search.searchHistory;
export const selectSearchSuggestions = (state: RootState) => state.search.suggestions;

// Entity-specific result selectors
export const selectPartResults = (state: RootState) => state.search.results.parts;
export const selectCustomerResults = (state: RootState) => state.search.results.customers;
export const selectVehicleResults = (state: RootState) => state.search.results.vehicles;

export default searchSlice.reducer;