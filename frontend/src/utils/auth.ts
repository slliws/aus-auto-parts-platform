/**
 * Authentication Utilities
 * Helper functions for JWT token management, refresh logic, and authentication state
 */

import { store } from '../store';
import { clearAuth, refreshAccessToken, logout } from '../store/slices/authSlice';
import authService from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

/**
 * Types
 */
interface JwtPayload {
  exp: number; // Expiration time
  iat: number; // Issued at
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  subscriptionTier: string;
  type: string;
}

/**
 * Constants
 */
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REMEMBER_ME_KEY = 'rememberMe';
const TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minute buffer before token expiry

/**
 * Get access token from storage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from storage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Set access token in storage
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Set refresh token in storage
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

/**
 * Set both tokens in storage
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Clear tokens from storage
 */
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Set remember me preference
 */
export const setRememberMe = (remember: boolean): void => {
  localStorage.setItem(REMEMBER_ME_KEY, String(remember));
};

/**
 * Get remember me preference
 */
export const getRememberMe = (): boolean => {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};

/**
 * Decode JWT token and extract payload
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Get current user role from access token
 */
export const getCurrentUserRole = (): string | null => {
  const token = getAccessToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.role ?? null;
};

/**
 * Check if current user has permission (role-based)
 */
export const hasRole = (requiredRole: string | string[]): boolean => {
  const userRole = getCurrentUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
};

/**
 * Check if token is valid and not expired
 */
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    // Check expiration with buffer
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

/**
 * Check if token is about to expire (within the buffer time)
 */
export const isTokenExpiringSoon = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    // Check if token expires within the buffer time
    const currentTime = Date.now() / 1000;
    return decoded.exp - currentTime < TOKEN_EXPIRY_BUFFER / 1000;
  } catch (error) {
    return false;
  }
};

/**
 * Get time remaining before token expires (in milliseconds)
 */
export const getTokenTimeRemaining = (token: string | null): number => {
  if (!token) return 0;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded) return 0;
    
    const currentTime = Date.now() / 1000;
    return Math.max(0, (decoded.exp - currentTime) * 1000);
  } catch (error) {
    return 0;
  }
};

/**
 * Attempt to refresh the access token
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    await store.dispatch(refreshAccessToken()).unwrap();
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

/**
 * Logout helper function
 * Clears tokens, dispatches logout action, and redirects
 */
export const logoutUser = async (redirectUrl = '/login'): Promise<void> => {
  try {
    await store.dispatch(logout()).unwrap();
  } catch (error) {
    console.error('Logout failed, clearing auth state anyway:', error);
    store.dispatch(clearAuth());
    clearTokens();
  } finally {
    window.location.href = redirectUrl;
  }
};

/**
 * Initialize auth refresh timer
 * Sets up a timer to refresh the access token before it expires
 */
export const initializeAuthRefreshTimer = (): (() => void) => {
  let timer: NodeJS.Timeout | null = null;
  
  const scheduleRefresh = () => {
    if (timer) clearTimeout(timer);
    
    const accessToken = getAccessToken();
    if (!accessToken) return;
    
    const timeRemaining = getTokenTimeRemaining(accessToken);
    
    if (timeRemaining <= 0) {
      // Token already expired, attempt refresh immediately
      refreshToken();
      return;
    }
    
    // Schedule refresh to occur before token expires
    const refreshTime = timeRemaining - TOKEN_EXPIRY_BUFFER;
    if (refreshTime > 0) {
      timer = setTimeout(async () => {
        const success = await refreshToken();
        if (success) {
          scheduleRefresh(); // Schedule next refresh
        }
      }, refreshTime);
    } else {
      // Token is about to expire, refresh immediately
      refreshToken().then(success => {
        if (success) scheduleRefresh();
      });
    }
  };
  
  // Start the timer
  scheduleRefresh();
  
  // Return cleanup function
  return () => {
    if (timer) clearTimeout(timer);
  };
};

export default {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setTokens,
  clearTokens,
  setRememberMe,
  getRememberMe,
  isTokenValid,
  isTokenExpiringSoon,
  getTokenTimeRemaining,
  refreshToken,
  logoutUser,
  initializeAuthRefreshTimer,
  getCurrentUserRole,
  hasRole,
};
