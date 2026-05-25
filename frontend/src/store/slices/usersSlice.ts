import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import apiService from '../../services/api.service';

/**
 * Users State Interface
 * Manages tenant users with RBAC roles
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES' | 'INVENTORY' | 'ACCOUNTANT' | 'CUSTOMER';
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface UsersState {
  users: User[];
  currentUser: User | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  pagination: PaginationMeta;
}

interface FetchUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isActive?: boolean;
}

interface FetchUsersResponse {
  data: User[];
  meta: PaginationMeta;
}

interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  password: string;
}

interface UpdateUserPayload {
  id: string;
  data: Partial<Omit<User, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>;
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  loading: 'idle',
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
};

/**
 * Async Thunk: Fetch Users
 */
export const fetchUsers = createAsyncThunk<FetchUsersResponse, FetchUsersParams>(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const queryParams: Record<string, any> = {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      };
      if (params.role) queryParams.role = params.role;
      if (params.search) queryParams.search = params.search;
      if (params.isActive !== undefined) queryParams.is_active = params.isActive;

      const res = await apiService.get('/users', { params: queryParams });
      const body = res.data;
      // Normalise envelope: support { data, meta } or { items, total, page, pageSize, totalPages }
      if (body.data && body.meta) {
        return { data: body.data, meta: body.meta };
      }
      return {
        data: body.items ?? body.data ?? [],
        meta: {
          currentPage: body.page ?? params.page ?? 1,
          totalPages: body.totalPages ?? 1,
          totalItems: body.total ?? 0,
          itemsPerPage: body.pageSize ?? params.limit ?? 10,
        },
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

/**
 * Async Thunk: Create User
 */
export const createUser = createAsyncThunk<User, CreateUserPayload>(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/users', userData);
      return res.data.data ?? res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

/**
 * Async Thunk: Update User
 * Backend route is PUT /users/:id (full replacement semantics for profile fields)
 */
export const updateUser = createAsyncThunk<User, UpdateUserPayload>(
  'users/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiService.put(`/users/${id}`, data);
      return res.data.data ?? res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

/**
 * Async Thunk: Delete User (soft delete)
 */
export const deleteUser = createAsyncThunk<string, string>(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/users/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

/**
 * Async Thunk: Fetch User by ID
 */
export const fetchUserById = createAsyncThunk<User, string>(
  'users/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`/users/${userId}`);
      return res.data.data ?? res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

/**
 * Async Thunk: Activate User
 */
export const activateUser = createAsyncThunk<User, string>(
  'users/activateUser',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`/users/${userId}/activate`, {});
      return res.data.data ?? res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate user');
    }
  }
);

/**
 * Async Thunk: Deactivate User
 */
export const deactivateUser = createAsyncThunk<User, string>(
  'users/deactivateUser',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`/users/${userId}/deactivate`, {});
      return res.data.data ?? res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate user');
    }
  }
);

/**
 * Async Thunk: Update User Role
 */
export const updateUserRole = createAsyncThunk<User, { id: string; role: User['role'] }>(
  'users/updateUserRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`/users/${id}/role`, { role });
      return res.data.data ?? res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearUsersError: (state) => {
      state.error = null;
    },
    clearUsers: (state) => {
      state.users = [];
      state.currentUser = null;
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.users = action.payload.data;
      state.pagination = action.payload.meta;
      state.error = null;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Create User
    builder.addCase(createUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.users.unshift(action.payload);
      state.pagination.totalItems += 1;
      state.error = null;
    });
    builder.addCase(createUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update User
    builder.addCase(updateUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) state.users[index] = action.payload;
      if (state.currentUser?.id === action.payload.id) state.currentUser = action.payload;
      state.error = null;
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Delete User
    builder.addCase(deleteUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.users = state.users.filter(u => u.id !== action.payload);
      if (state.currentUser?.id === action.payload) state.currentUser = null;
      state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1);
      state.error = null;
    });
    builder.addCase(deleteUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Fetch User by ID
    builder.addCase(fetchUserById.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.currentUser = action.payload;
      state.error = null;
    });
    builder.addCase(fetchUserById.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Activate User — pending prevents double-fire race condition
    builder.addCase(activateUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(activateUser.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) state.users[index] = action.payload;
      state.error = null;
    });
    builder.addCase(activateUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Deactivate User — pending prevents double-fire race condition
    builder.addCase(deactivateUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(deactivateUser.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) state.users[index] = action.payload;
      state.error = null;
    });
    builder.addCase(deactivateUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Update User Role — pending prevents double-submit on slow networks
    builder.addCase(updateUserRole.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(updateUserRole.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) state.users[index] = action.payload;
      state.error = null;
    });
    builder.addCase(updateUserRole.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });
  },
});

// Actions
export const { setCurrentUser, clearUsersError, clearUsers } = usersSlice.actions;

// Selectors
export const selectUsers = (state: RootState) => state.users.users;
export const selectCurrentUser = (state: RootState) => state.users.currentUser;
export const selectUsersLoading = (state: RootState) => state.users.loading;
export const selectUsersError = (state: RootState) => state.users.error;
export const selectUsersPagination = (state: RootState) => state.users.pagination;
export const selectUserById = (state: RootState, userId: string) =>
  state.users.users.find(user => user.id === userId);
export const selectUsersByRole = (state: RootState, role: string) =>
  state.users.users.filter(user => user.role === role);

export default usersSlice.reducer;
