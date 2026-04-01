import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import * as vehicleService from '../../services/vehicle.service';
import type {
  Vehicle,
  CreateVehicleData,
  UpdateVehicleData,
  VehiclesFilters,
  PaginationParams,
  VehicleDetails,
} from '../../services/vehicle.service';

/**
 * Vehicles State Interface
 * Manages vehicle records and related data
 */

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface VehiclesState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  vinDecodingResult: VehicleDetails | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  pagination: PaginationMeta;
  filters: VehiclesFilters;
  makes: string[];
  models: string[];
}

interface FetchVehiclesParams {
  page?: number;
  limit?: number;
  filters?: VehiclesFilters;
}

const initialState: VehiclesState = {
  vehicles: [],
  currentVehicle: null,
  vinDecodingResult: null,
  loading: 'idle',
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
  makes: [],
  models: [],
};

/**
 * Async Thunk: Fetch Vehicles
 * Retrieves paginated list of vehicles with filtering
 */
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (params: FetchVehiclesParams = {}, { rejectWithValue }) => {
    try {
      const { page, limit, filters } = params;
      const response = await vehicleService.fetchVehicles(
        filters,
        { page, limit }
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vehicles');
    }
  }
);

/**
 * Async Thunk: Create Vehicle
 * Creates new vehicle record
 */
export const createVehicle = createAsyncThunk(
  'vehicles/createVehicle',
  async (vehicleData: CreateVehicleData, { rejectWithValue }) => {
    try {
      const vehicle = await vehicleService.createVehicle(vehicleData);
      return vehicle;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create vehicle');
    }
  }
);

/**
 * Async Thunk: Update Vehicle
 * Updates existing vehicle details
 */
export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async ({ id, data }: { id: string; data: UpdateVehicleData }, { rejectWithValue }) => {
    try {
      const vehicle = await vehicleService.updateVehicle(id, data);
      return vehicle;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update vehicle');
    }
  }
);

/**
 * Async Thunk: Delete Vehicle
 * Soft deletes vehicle (sets is_active to false)
 */
export const deleteVehicle = createAsyncThunk(
  'vehicles/deleteVehicle',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      await vehicleService.deleteVehicle(vehicleId);
      return vehicleId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete vehicle');
    }
  }
);

/**
 * Async Thunk: Fetch Vehicle by ID
 * Retrieves single vehicle with full details
 */
export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchVehicleById',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const vehicle = await vehicleService.fetchVehicleById(vehicleId);
      return vehicle;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vehicle');
    }
  }
);

/**
 * Async Thunk: Fetch Customer's Vehicles
 * Retrieves vehicles associated with a specific customer
 */
export const fetchCustomerVehicles = createAsyncThunk(
  'vehicles/fetchCustomerVehicles',
  async ({ customerId, pagination }: { customerId: string; pagination?: PaginationParams }, { rejectWithValue }) => {
    try {
      const response = await vehicleService.fetchCustomerVehicles(customerId, pagination);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch customer vehicles');
    }
  }
);

/**
 * Async Thunk: Search Vehicles
 * Search vehicles by query string
 */
export const searchVehicles = createAsyncThunk(
  'vehicles/searchVehicles',
  async ({ query, filters, pagination }: { query: string; filters?: VehiclesFilters; pagination?: PaginationParams }, { rejectWithValue }) => {
    try {
      const response = await vehicleService.searchVehicles(query, filters, pagination);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search vehicles');
    }
  }
);

/**
 * Async Thunk: Decode VIN
 * Decode a VIN without saving
 */
export const decodeVin = createAsyncThunk(
  'vehicles/decodeVin',
  async (vin: string, { rejectWithValue }) => {
    try {
      const vehicleDetails = await vehicleService.decodeVin(vin);
      return vehicleDetails;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to decode VIN');
    }
  }
);

/**
 * Async Thunk: Fetch Vehicle Makes
 * Get a list of all supported vehicle makes
 */
export const fetchVehicleMakes = createAsyncThunk(
  'vehicles/fetchVehicleMakes',
  async (_, { rejectWithValue }) => {
    try {
      const makes = await vehicleService.getVehicleMakes();
      return makes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vehicle makes');
    }
  }
);

/**
 * Async Thunk: Fetch Models For Make
 * Get a list of models for a specific make
 */
export const fetchModelsForMake = createAsyncThunk(
  'vehicles/fetchModelsForMake',
  async (make: string, { rejectWithValue }) => {
    try {
      const models = await vehicleService.getModelsForMake(make);
      return models;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch models for make');
    }
  }
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setCurrentVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },
    setVehicleFilters: (state, action: PayloadAction<VehiclesFilters>) => {
      state.filters = action.payload;
    },
    clearVehicleFilters: (state) => {
      state.filters = {};
    },
    clearVinDecodingResult: (state) => {
      state.vinDecodingResult = null;
    },
    clearVehiclesError: (state) => {
      state.error = null;
    },
    clearVehicles: (state) => {
      state.vehicles = [];
      state.currentVehicle = null;
      state.vinDecodingResult = null;
      state.pagination = initialState.pagination;
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Vehicles
    builder.addCase(fetchVehicles.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchVehicles.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.vehicles = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchVehicles.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Create Vehicle
    builder.addCase(createVehicle.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(createVehicle.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.vehicles.unshift(action.payload);
      state.pagination.totalItems += 1;
      state.error = null;
    });
    builder.addCase(createVehicle.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update Vehicle
    builder.addCase(updateVehicle.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateVehicle.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      }
      if (state.currentVehicle?.id === action.payload.id) {
        state.currentVehicle = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateVehicle.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Delete Vehicle
    builder.addCase(deleteVehicle.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(deleteVehicle.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.vehicles = state.vehicles.filter(vehicle => vehicle.id !== action.payload);
      if (state.currentVehicle?.id === action.payload) {
        state.currentVehicle = null;
      }
      state.pagination.totalItems -= 1;
      state.error = null;
    });
    builder.addCase(deleteVehicle.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Vehicle by ID
    builder.addCase(fetchVehicleById.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchVehicleById.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.currentVehicle = action.payload;
      state.error = null;
    });
    builder.addCase(fetchVehicleById.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Customer's Vehicles
    builder.addCase(fetchCustomerVehicles.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchCustomerVehicles.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.vehicles = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchCustomerVehicles.rejected, (state, action) => {
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
      state.vehicles = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(searchVehicles.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Decode VIN
    builder.addCase(decodeVin.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(decodeVin.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.vinDecodingResult = action.payload;
      state.error = null;
    });
    builder.addCase(decodeVin.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Vehicle Makes
    builder.addCase(fetchVehicleMakes.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchVehicleMakes.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.makes = action.payload;
      state.error = null;
    });
    builder.addCase(fetchVehicleMakes.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch Models For Make
    builder.addCase(fetchModelsForMake.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchModelsForMake.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.models = action.payload;
      state.error = null;
    });
    builder.addCase(fetchModelsForMake.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
  },
});

// Actions
export const {
  setCurrentVehicle,
  setVehicleFilters,
  clearVehicleFilters,
  clearVinDecodingResult,
  clearVehiclesError,
  clearVehicles,
} = vehiclesSlice.actions;

// Selectors
export const selectVehicles = (state: RootState) => state.vehicles.vehicles;
export const selectCurrentVehicle = (state: RootState) => state.vehicles.currentVehicle;
export const selectVinDecodingResult = (state: RootState) => state.vehicles.vinDecodingResult;
export const selectVehiclesLoading = (state: RootState) => state.vehicles.loading;
export const selectVehiclesError = (state: RootState) => state.vehicles.error;
export const selectVehiclesPagination = (state: RootState) => state.vehicles.pagination;
export const selectVehicleFilters = (state: RootState) => state.vehicles.filters;
export const selectVehicleMakes = (state: RootState) => state.vehicles.makes;
export const selectVehicleModels = (state: RootState) => state.vehicles.models;
export const selectVehicleById = (state: RootState, vehicleId: string) =>
  state.vehicles.vehicles.find(vehicle => vehicle.id === vehicleId);

export default vehiclesSlice.reducer;