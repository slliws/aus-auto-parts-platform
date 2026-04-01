import apiService, { type ApiResponse } from './api.service';

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface VerificationResponse {
  verificationToken: string;
}

export interface ResetTokenResponse {
  resetToken: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }
    
    return response.data;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ user: User; verificationToken: string }> {
    const response = await apiService.post<{ user: User; verificationToken: string }>('/auth/register', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await apiService.post('/auth/logout', { refreshToken });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiService.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Token refresh failed');
    }
    
    return response.data;
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<string> {
    const response = await apiService.post<ResetTokenResponse>('/auth/forgot-password', { email });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Password reset request failed');
    }
    
    return response.data.resetToken;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiService.post('/auth/reset-password', { token, newPassword });
    
    if (!response.success) {
      throw new Error(response.message || 'Password reset failed');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    const response = await apiService.post('/auth/verify-email', { token });
    
    if (!response.success) {
      throw new Error(response.message || 'Email verification failed');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<{ user: User; tenant: any }> {
    const response = await apiService.get<{ user: User; tenant: any }>('/auth/me');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get current user');
    }
    
    return response.data;
  }
}

export default new AuthService();