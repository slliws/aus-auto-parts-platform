/**
 * Authentication service
 * Handles business logic for authentication operations
 * Implements complete JWT-based authentication with audit logging
 */

import bcrypt from 'bcrypt';
import config from '../config';
import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from '../utils/jwt';
import { User, Tenant, Prisma } from '@prisma/client';

/**
 * Interface for registration data
 */
export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}

/**
 * Interface for login data
 */
export interface LoginDTO {
  email: string;
  password: string;
  tenantId?: string;
}

/**
 * Interface for password reset data
 */
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

/**
 * Interface for authentication result
 */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}

/**
 * Interface for audit log data
 */
interface AuditLogData {
  action: string;
  userId?: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId || null,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        changes: (data.changes as Prisma.InputJsonValue) || Prisma.JsonNull,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, data });
    // Don't throw - audit log failure shouldn't break the main operation
  }
};

/**
 * Remove password_hash from user object
 */
const sanitizeUser = (user: User): Omit<User, 'password_hash'> => {
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

/**
 * Register new user
 */
export const register = async (
  data: RegisterDTO,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: Omit<User, 'password_hash'>; verificationToken: string }> => {
  // Check if tenant exists and is active
  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId },
  });

  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  if (!tenant.is_active) {
    throw new ValidationError('Tenant is not active');
  }

  // Check if user with email already exists in this tenant
  const existingUser = await prisma.user.findFirst({
    where: {
      email: data.email.toLowerCase(),
      tenant_id: data.tenantId,
    },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists in this tenant');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      tenant_id: data.tenantId,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'VIEWER', // Default role
      is_active: true,
      email_verified: false,
    },
  });

  // Generate email verification token
  const verificationToken = generateEmailVerificationToken(user.id, user.email);

  // Create audit log
  await createAuditLog({
    action: 'USER_REGISTER',
    userId: user.id,
    tenantId: data.tenantId,
    resourceType: 'User',
    resourceId: user.id,
    changes: {
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    ipAddress,
    userAgent,
  });

  logger.info('User registered successfully', {
    userId: user.id,
    email: user.email,
    tenantId: data.tenantId,
  });

  // TODO: Send verification email (stub for now)
  logger.info('Email verification token generated (email sending not implemented)', {
    userId: user.id,
    token: verificationToken,
  });

  return {
    user: sanitizeUser(user),
    verificationToken,
  };
};

/**
 * Login user
 */
export const login = async (
  data: LoginDTO,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResult> => {
  // Find user by email
  let user: User | null;

  if (data.tenantId) {
    // If tenant ID is provided, find user in that tenant
    user = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
        tenant_id: data.tenantId,
      },
    });
  } else {
    // If no tenant ID, find user by email (they should only belong to one tenant)
    user = await prisma.user.findUnique({
      where: {
        email: data.email.toLowerCase(),
      },
    });
  }

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new AuthenticationError('User account is inactive');
  }

  // Check if email is verified
  if (!user.email_verified) {
    throw new AuthenticationError('Email not verified. Please verify your email to login.');
  }

  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenant_id },
  });

  if (!tenant) {
    throw new AuthenticationError('Tenant not found');
  }

  if (!tenant.is_active) {
    throw new AuthenticationError('Tenant is not active');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user, tenant);
  const { token: refreshToken, jti, expiresAt } = generateRefreshToken(user, tenant);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      tenant_id: user.tenant_id,
      user_id: user.id,
      token: refreshToken,
      jti,
      expires_at: expiresAt,
      revoked: false,
    },
  });

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  // Create audit log
  await createAuditLog({
    action: 'USER_LOGIN',
    userId: user.id,
    tenantId: user.tenant_id,
    resourceType: 'User',
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email,
    tenantId: user.tenant_id,
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshTokenString: string
): Promise<{ accessToken: string; refreshToken?: string }> => {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshTokenString);

  // Check if token exists in database and is not revoked
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
  });

  if (!tokenRecord) {
    throw new AuthenticationError('Invalid refresh token');
  }

  if (tokenRecord.revoked) {
    throw new AuthenticationError('Refresh token has been revoked');
  }

  if (new Date() > tokenRecord.expires_at) {
    throw new AuthenticationError('Refresh token has expired');
  }

  // Get user and tenant
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.is_active) {
    throw new AuthenticationError('User account is inactive');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenant_id },
  });

  if (!tenant) {
    throw new AuthenticationError('Tenant not found');
  }

  if (!tenant.is_active) {
    throw new AuthenticationError('Tenant is not active');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user, tenant);

  // Optional: Rotate refresh token for better security
  // For now, we'll keep the same refresh token
  // In production, consider implementing refresh token rotation

  logger.info('Access token refreshed', {
    userId: user.id,
    tenantId: user.tenant_id,
  });

  return {
    accessToken,
  };
};

/**
 * Logout user
 */
export const logout = async (
  refreshTokenString: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshTokenString);

  // Revoke refresh token
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { jti: payload.jti },
  });

  if (tokenRecord) {
    await prisma.refreshToken.update({
      where: { jti: payload.jti },
      data: { revoked: true },
    });

    // Create audit log
    await createAuditLog({
      action: 'USER_LOGOUT',
      userId: payload.userId,
      tenantId: payload.tenantId,
      resourceType: 'User',
      resourceId: payload.userId,
      ipAddress,
      userAgent,
    });

    logger.info('User logged out successfully', {
      userId: payload.userId,
      tenantId: payload.tenantId,
    });
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Verify token
  const payload = verifyEmailVerificationToken(token);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.email !== payload.email) {
    throw new AuthenticationError('Invalid verification token');
  }

  if (user.email_verified) {
    // Already verified, but don't throw error
    logger.info('Email already verified', { userId: user.id });
    return;
  }

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: { email_verified: true },
  });

  // Create audit log
  await createAuditLog({
    action: 'EMAIL_VERIFIED',
    userId: user.id,
    tenantId: user.tenant_id,
    resourceType: 'User',
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  logger.info('Email verified successfully', {
    userId: user.id,
    email: user.email,
  });
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // For security, don't reveal if user exists
    logger.info('Password reset requested for non-existent email', { email });
    // Return a dummy token to avoid timing attacks
    return generatePasswordResetToken('00000000-0000-0000-0000-000000000000', email);
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken(user.id, user.email);

  // Create audit log
  await createAuditLog({
    action: 'PASSWORD_RESET_REQUESTED',
    userId: user.id,
    tenantId: user.tenant_id,
    resourceType: 'User',
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  logger.info('Password reset requested', {
    userId: user.id,
    email: user.email,
  });

  // TODO: Send reset email (stub for now)
  logger.info('Password reset token generated (email sending not implemented)', {
    userId: user.id,
    token: resetToken,
  });

  return resetToken;
};

/**
 * Reset password
 */
export const resetPassword = async (
  data: ResetPasswordDTO,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Verify token
  const payload = verifyPasswordResetToken(data.token);

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.email !== payload.email) {
    throw new AuthenticationError('Invalid reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(data.newPassword, config.security.bcryptRounds);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: passwordHash },
  });

  // Revoke all existing refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: {
      user_id: user.id,
      revoked: false,
    },
    data: { revoked: true },
  });

  // Create audit log
  await createAuditLog({
    action: 'PASSWORD_RESET',
    userId: user.id,
    tenantId: user.tenant_id,
    resourceType: 'User',
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  logger.info('Password reset successfully', {
    userId: user.id,
    email: user.email,
  });
};

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
};