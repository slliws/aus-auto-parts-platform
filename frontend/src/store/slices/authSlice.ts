import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import authService, {
  type User as ApiUser,
  type AuthResponse,
  type RegisterData
} from '../../services/auth.service';

/**
 * Authentication State Interface
 * Manages user authentication, JWT tokens, and tenant context
 */
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'SALES' | 'INVENTORY' | 'ACCOUNTANT' | 'CUSTOMER';
  isActive: boolean;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
}

const initialState: AuthState = {
  user: null,
  tenantId: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: 'idle',
  error: null,
};

/**
 * Async Thunk: Login User
 * Authenticates user with email/password and retrieves JWT tokens
 */
export const login = createAsyncThunk<LoginResponse, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      
      // Transform API response to match frontend types
      return {
        user: {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          role: response.user.role as any,
          isActive: response.user.is_active,
          tenantId: response.user.tenant_id,
        },
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

/**
 * Async Thunk: Register User
 * Creates a new user account
 */
export const register = createAsyncThunk<{ user: User; verificationToken: string }, RegisterData>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      
      // Transform API response to match frontend types
      return {
        user: {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          role: response.user.role as any,
          isActive: response.user.is_active,
          tenantId: response.user.tenant_id,
        },
        verificationToken: response.verificationToken
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

/**
 * Async Thunk: Logout User
 * Invalidates refresh token and clears authentication state
 */
export const logout = createAsyncThunk<void, void>(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

/**
 * Async Thunk: Refresh Access Token
 * Uses refresh token to obtain new access token (1-hour expiry)
 */
export const refreshAccessToken = createAsyncThunk<RefreshTokenResponse, void>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.tenantId = action.payload.tenantId;
      state.isAuthenticated = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    clearAuth: (state) => {
      state.user = null;
      state.tenantId = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state) => {
      state.loading = 'succeeded';
      // Don't update auth state, user needs to verify email and log in
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.user = action.payload.user;
      state.tenantId = action.payload.user.tenantId;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      
      // Persist tokens
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logout.pending, (state) => {
      state.loading = 'pending';
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.loading = 'idle';
      state.user = null;
      state.tenantId = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
      // Still clear auth state even if API call failed
      state.user = null;
      state.tenantId = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });

    // Refresh Token
    builder.addCase(refreshAccessToken.pending, (state) => {
      state.loading = 'pending';
    });
    builder.addCase(refreshAccessToken.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      state.accessToken = action.payload.accessToken;
      state.error = null;
      localStorage.setItem('accessToken', action.payload.accessToken);
    });
    builder.addCase(refreshAccessToken.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
      // Clear auth state if refresh fails (token expired)
      state.user = null;
      state.tenantId = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
  },
});

// Actions
export const { setUser, clearError, setTokens, clearAuth } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectTenantId = (state: RootState) => state.auth.tenantId;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectUserRole = (state: RootState) => state.auth.user?.role;

export default authSlice.reducer;