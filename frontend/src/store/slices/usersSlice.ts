import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

/**
 * Users State Interface
 * Manages tenant users with RBAC roles
 */
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'SALES' | 'INVENTORY' | 'ACCOUNTANT' | 'CUSTOMER';
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
}

interface FetchUsersResponse {
  data: User[];
  meta: PaginationMeta;
}

interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'SALES' | 'INVENTORY' | 'ACCOUNTANT' | 'CUSTOMER';
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
 * Retrieves paginated list of tenant users with optional filters
 */
export const fetchUsers = createAsyncThunk<FetchUsersResponse, FetchUsersParams>(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to GET /api/v1/users
      // const response = await usersAPI.getUsers(params);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

/**
 * Async Thunk: Create User
 * Creates new tenant user with specified role
 */
export const createUser = createAsyncThunk<User, CreateUserPayload>(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to POST /api/v1/users
      // const response = await usersAPI.createUser(userData);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

/**
 * Async Thunk: Update User
 * Updates existing user details (role, active status, etc.)
 */
export const updateUser = createAsyncThunk<User, UpdateUserPayload>(
  'users/updateUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to PUT /api/v1/users/:id
      // const response = await usersAPI.updateUser(id, data);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

/**
 * Async Thunk: Delete User
 * Soft deletes user (sets isActive to false)
 */
export const deleteUser = createAsyncThunk<string, string>(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to DELETE /api/v1/users/:id
      // await usersAPI.deleteUser(userId);
      // return userId;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

/**
 * Async Thunk: Fetch User by ID
 * Retrieves single user details
 */
export const fetchUserById = createAsyncThunk<User, string>(
  'users/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      // TODO: Implement API call to GET /api/v1/users/:id
      // const response = await usersAPI.getUserById(userId);
      // return response.data;
      
      // Placeholder for Phase 3
      throw new Error('API implementation pending');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
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
      state.users.unshift(action.payload); // Add to beginning of list
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
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = action.payload;
      }
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
      state.users = state.users.filter(user => user.id !== action.payload);
      if (state.currentUser?.id === action.payload) {
        state.currentUser = null;
      }
      state.pagination.totalItems -= 1;
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