import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import * as partsService from '../../services/parts.service';

/**
 * Parts State Interface
 * Manages auto parts inventory, stock levels, and suppliers
 */
interface Part {
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
  createdAt: string;
  updatedAt: string;
}

interface PartSearchResult extends Part {
  relevanceScore: number;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PartFilters {
  search?: string;
  category?: string;
  manufacturer?: string;
  isActive?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

interface PartsState {
  parts: Part[];
  currentPart: Part | null;
  searchResults: PartSearchResult[];
  favoriteParts: string[]; // Array of favorite part IDs
  categories: partsService.Category[];
  recentlyViewed: string[]; // Array of recently viewed part IDs
  searchSuggestions: partsService.SearchSuggestion[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  pagination: PaginationMeta;
  filters: PartFilters;
  sortBy: string; // Current sort option
}

interface FetchPartsParams {
  page?: number;
  limit?: number;
  filters?: PartFilters;
}

interface FetchPartsResponse {
  data: Part[];
  meta: PaginationMeta;
}

interface CreatePartPayload {
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  manufacturer?: string;
  supplierPartNumber?: string;
  location?: string;
  quantityInStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  sellingPrice: number;
}

interface UpdatePartPayload {
  id: string;
  data: Partial<Omit<Part, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>;
}

interface BulkUpdatePayload {
  partIds: string[];
  updates: Partial<Omit<Part, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>;
}

interface SearchPartsParams {
  query: string;
  filters?: PartFilters;
  limit?: number;
}

const initialState: PartsState = {
  parts: [],
  currentPart: null,
  searchResults: [],
  favoriteParts: [],
  categories: [],
  recentlyViewed: [],
  searchSuggestions: [],
  loading: 'idle',
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
  sortBy: 'relevance',
};

/**
 * Async Thunk: Fetch Parts
 * Retrieves paginated inventory list with filtering
 */
export const fetchParts = createAsyncThunk<FetchPartsResponse, FetchPartsParams>(
  'parts/fetchParts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await partsService.fetchParts(
        params.filters,
        { page: params.page, limit: params.limit }
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch parts');
    }
  }
);

/**
 * Async Thunk: Create Part
 * Creates new inventory item
 */
export const createPart = createAsyncThunk<Part, CreatePartPayload>(
  'parts/createPart',
  async (partData, { rejectWithValue }) => {
    try {
      const response = await partsService.createPart(partData as any);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create part');
    }
  }
);

/**
 * Async Thunk: Update Part
 * Updates existing inventory item details
 */
export const updatePart = createAsyncThunk<Part, UpdatePartPayload>(
  'parts/updatePart',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await partsService.updatePart(id, data as any);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update part');
    }
  }
);

/**
 * Async Thunk: Delete Part
 * Soft deletes part (sets isActive to false)
 */
export const deletePart = createAsyncThunk<string, string>(
  'parts/deletePart',
  async (partId, { rejectWithValue }) => {
    try {
      await partsService.deletePart(partId);
      return partId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete part');
    }
  }
);

/**
 * Async Thunk: Fetch Part by ID
 * Retrieves single part with full details and adds to recently viewed
 */
export const fetchPartById = createAsyncThunk<Part, string>(
  'parts/fetchPartById',
  async (partId, { rejectWithValue }) => {
    try {
      const part = await partsService.fetchPartById(partId);
      // Add to recently viewed
      partsService.addToRecentlyViewed(partId);
      return part;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch part');
    }
  }
);

/**
 * Async Thunk: Search Parts
 * Full-text search with relevance scoring
 */
export const searchParts = createAsyncThunk<Part[], SearchPartsParams>(
  'parts/searchParts',
  async (params, { rejectWithValue }) => {
    try {
      const results = await partsService.searchParts(
        params.query,
        params.filters,
        params.limit
      );
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search parts');
    }
  }
);

/**
 * Async Thunk: Fetch Search Suggestions
 * Get autocomplete suggestions for search
 */
export const fetchSearchSuggestions = createAsyncThunk<partsService.SearchSuggestion[], string>(
  'parts/fetchSearchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      const suggestions = await partsService.getSearchSuggestions(query);
      return suggestions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch suggestions');
    }
  }
);

/**
 * Async Thunk: Fetch Categories
 * Get all categories with item counts
 */
export const fetchCategories = createAsyncThunk<partsService.Category[], void>(
  'parts/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await partsService.fetchCategories();
      return categories;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

/**
 * Async Thunk: Save Part to Favorites
 * Add part to user's favorites
 */
export const savePartToFavorites = createAsyncThunk<string, string>(
  'parts/savePartToFavorites',
  async (partId, { rejectWithValue }) => {
    try {
      await partsService.savePart(partId);
      return partId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save part');
    }
  }
);

/**
 * Async Thunk: Remove Part from Favorites
 * Remove part from user's favorites
 */
export const removePartFromFavorites = createAsyncThunk<string, { partId: string; favoriteId: string }>(
  'parts/removePartFromFavorites',
  async ({ partId, favoriteId }, { rejectWithValue }) => {
    try {
      await partsService.unsavePart(favoriteId);
      return partId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove part');
    }
  }
);

/**
 * Async Thunk: Fetch Favorite Parts
 * Get all user's favorite parts
 */
export const fetchFavoriteParts = createAsyncThunk<Part[], void>(
  'parts/fetchFavoriteParts',
  async (_, { rejectWithValue }) => {
    try {
      const favorites = await partsService.fetchFavoriteParts();
      return favorites;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch favorites');
    }
  }
);

/**
 * Async Thunk: Fetch Parts by Category
 * Get parts in a specific category
 */
export const fetchPartsByCategory = createAsyncThunk<FetchPartsResponse, { categoryId: string; page?: number; limit?: number }>(
  'parts/fetchPartsByCategory',
  async ({ categoryId, page, limit }, { rejectWithValue }) => {
    try {
      const response = await partsService.fetchPartsByCategory(categoryId, { page, limit });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch parts by category');
    }
  }
);

/**
 * Async Thunk: Bulk Update Parts
 * Updates multiple parts simultaneously (e.g., price adjustments)
 */
export const bulkUpdateParts = createAsyncThunk<Part[], BulkUpdatePayload>(
  'parts/bulkUpdateParts',
  async (payload, { rejectWithValue }) => {
    try {
      // Bulk update by updating each part individually
      const updatedParts = await Promise.all(
        payload.partIds.map(partId =>
          partsService.updatePart(partId, payload.updates as any)
        )
      );
      return updatedParts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk update parts');
    }
  }
);

/**
 * Async Thunk: Fetch Low Stock Parts
 * Retrieves parts below reorder level
 */
export const fetchLowStockParts = createAsyncThunk<Part[], void>(
  'parts/fetchLowStockParts',
  async (_, { rejectWithValue }) => {
    try {
      const parts = await partsService.fetchLowStockParts();
      return parts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch low stock parts');
    }
  }
);

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    setCurrentPart: (state, action: PayloadAction<Part | null>) => {
      state.currentPart = action.payload;
      if (action.payload?.id) {
        const recentlyViewed = partsService.getRecentlyViewedParts();
        state.recentlyViewed = recentlyViewed;
      }
    },
    setPartFilters: (state, action: PayloadAction<PartFilters>) => {
      state.filters = action.payload;
    },
    clearPartFilters: (state) => {
      state.filters = {};
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearSearchSuggestions: (state) => {
      state.searchSuggestions = [];
    },
    clearPartsError: (state) => {
      state.error = null;
    },
    clearParts: (state) => {
      state.parts = [];
      state.currentPart = null;
      state.searchResults = [];
      state.pagination = initialState.pagination;
      state.filters = {};
    },
    updateLocalStock: (state, action: PayloadAction<{ partId: string; quantity: number }>) => {
      const part = state.parts.find(p => p.id === action.payload.partId);
      if (part) {
        part.quantityInStock = action.payload.quantity;
      }
      if (state.currentPart?.id === action.payload.partId) {
        state.currentPart.quantityInStock = action.payload.quantity;
      }
    },
    loadRecentlyViewed: (state) => {
      state.recentlyViewed = partsService.getRecentlyViewedParts();
    },
  },
  extraReducers: (builder) => {
    // Fetch Parts
    builder.addCase(fetchParts.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchParts.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.parts = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchParts.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Create Part
    builder.addCase(createPart.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(createPart.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.parts.unshift(action.payload);
      state.pagination.totalItems += 1;
      state.error = null;
    });
    builder.addCase(createPart.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update Part
    builder.addCase(updatePart.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updatePart.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.parts.findIndex(part => part.id === action.payload.id);
      if (index !== -1) {
        state.parts[index] = action.payload;
      }
      if (state.currentPart?.id === action.payload.id) {
        state.currentPart = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updatePart.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Delete Part
    builder.addCase(deletePart.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(deletePart.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.parts = state.parts.filter(part => part.id !== action.payload);
      if (state.currentPart?.id === action.payload) {
        state.currentPart = null;
      }
      state.pagination.totalItems -= 1;
      state.error = null;
    });
    builder.addCase(deletePart.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Part by ID
    builder.addCase(fetchPartById.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchPartById.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.currentPart = action.payload;
      state.error = null;
    });
    builder.addCase(fetchPartById.rejected, (state, action) => {
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
      state.searchResults = action.payload as any;
      state.error = null;
    });
    builder.addCase(searchParts.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Search Suggestions
    builder.addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
      state.searchSuggestions = action.payload;
    });

    // Fetch Categories
    builder.addCase(fetchCategories.pending, (state) => {
      state.loading = 'pending';
    });
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.categories = action.payload;
    });
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Save Part to Favorites
    builder.addCase(savePartToFavorites.fulfilled, (state, action) => {
      if (!state.favoriteParts.includes(action.payload)) {
        state.favoriteParts.push(action.payload);
      }
    });

    // Remove Part from Favorites
    builder.addCase(removePartFromFavorites.fulfilled, (state, action) => {
      state.favoriteParts = state.favoriteParts.filter(id => id !== action.payload);
    });

    // Fetch Favorite Parts
    builder.addCase(fetchFavoriteParts.fulfilled, (state, action) => {
      state.favoriteParts = action.payload.map(part => part.id);
    });

    // Fetch Parts by Category
    builder.addCase(fetchPartsByCategory.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchPartsByCategory.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.parts = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchPartsByCategory.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Bulk Update Parts
    builder.addCase(bulkUpdateParts.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(bulkUpdateParts.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      action.payload.forEach(updatedPart => {
        const index = state.parts.findIndex(part => part.id === updatedPart.id);
        if (index !== -1) {
          state.parts[index] = updatedPart;
        }
      });
      state.error = null;
    });
    builder.addCase(bulkUpdateParts.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Low Stock Parts
    builder.addCase(fetchLowStockParts.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchLowStockParts.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      // Store in main parts array with low stock flag
      state.parts = action.payload;
      state.error = null;
    });
    builder.addCase(fetchLowStockParts.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
  },
});

// Actions
export const {
  setCurrentPart,
  setPartFilters,
  clearPartFilters,
  clearSearchResults,
  clearPartsError,
  clearParts,
  updateLocalStock,
} = partsSlice.actions;

// Selectors
export const selectParts = (state: RootState) => state.parts.parts;
export const selectCurrentPart = (state: RootState) => state.parts.currentPart;
export const selectPartSearchResults = (state: RootState) => state.parts.searchResults;
export const selectPartsLoading = (state: RootState) => state.parts.loading;
export const selectPartsError = (state: RootState) => state.parts.error;
export const selectPartsPagination = (state: RootState) => state.parts.pagination;
export const selectPartFilters = (state: RootState) => state.parts.filters;
export const selectPartById = (state: RootState, partId: string) =>
  state.parts.parts.find(part => part.id === partId);
export const selectLowStockParts = (state: RootState) =>
  state.parts.parts.filter(part => part.quantityInStock <= part.reorderLevel);
export const selectPartsByCategory = (state: RootState, category: string) =>
  state.parts.parts.filter(part => part.category === category);

export default partsSlice.reducer;