import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as authService from '../services/auth.service';
import { logger } from '../utils/logger';

/**
 * Authentication controller
 * Handles user authentication, registration, and token management
 */

/**
 * Extract IP address from request
 */
const getIpAddress = (req: Request): string | undefined => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined
  );
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req: Request): string | undefined => {
  return req.headers['user-agent'] || undefined;
};

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password, firstName, lastName, tenantId } = req.body;

    const result = await authService.register(
      { email, password, firstName, lastName, tenantId },
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: result.user,
        verificationToken: result.verificationToken, // In production, this would be emailed
      },
    };

    res.status(201).json(response);
  }
);

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password, tenantId } = req.body;

    const result = await authService.login(
      { email, password, tenantId },
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    };

    res.status(200).json(response);
  }
);

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;

    await authService.logout(
      refreshToken,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  }
);

/**
 * Refresh access token
 * @route POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    };

    res.status(200).json(response);
  }
);

/**
 * Request password reset
 * @route POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;

    const resetToken = await authService.requestPasswordReset(
      email,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      data: {
        resetToken, // In production, this would be emailed, not returned
      },
    };

    res.status(200).json(response);
  }
);

/**
 * Reset password with token
 * @route POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { token, newPassword } = req.body;

    await authService.resetPassword(
      { token, newPassword },
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    };

    res.status(200).json(response);
  }
);

/**
 * Verify email address
 * @route POST /api/v1/auth/verify-email
 */
export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { token } = req.body;

    await authService.verifyEmail(
      token,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Email verified successfully. You can now login.',
    };

    res.status(200).json(response);
  }
);

/**
 * Get current authenticated user
 * @route GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // User is already attached to request by auth middleware
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        user: req.user,
        tenant: req.tenant,
      },
    };

    res.status(200).json(response);
  }
);

export default {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getCurrentUser,
};