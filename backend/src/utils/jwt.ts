import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import config from '../config';
import { User, Tenant, SubscriptionTier, UserRole } from '@prisma/client';
import { AuthenticationError } from './errors';

/**
 * JWT utility functions for token generation and verification
 * Implements secure JWT token handling for the Australian Auto Parts Platform
 */

/**
 * Access token payload structure
 */
export interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  type: 'access';
}

/**
 * Refresh token payload structure
 */
export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  type: 'refresh';
  jti: string; // Unique token ID for revocation
}

/**
 * Email verification token payload
 */
export interface EmailVerificationTokenPayload {
  userId: string;
  email: string;
  type: 'email_verification';
}

/**
 * Password reset token payload
 */
export interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  type: 'password_reset';
}

/**
 * Generate access token
 * @param user - User object
 * @param tenant - Tenant object
 * @returns JWT access token
 */
export const generateAccessToken = (user: User, tenant: Tenant): string => {
  const payload: AccessTokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role,
    subscriptionTier: tenant.subscription_tier,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiry as StringValue,
    issuer: config.jwt.issuer,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Generate refresh token
 * @param user - User object
 * @param tenant - Tenant object
 * @returns Object containing JWT refresh token and JTI
 */
export const generateRefreshToken = (
  user: User,
  tenant: Tenant
): { token: string; jti: string; expiresAt: Date } => {
  const jti = randomUUID();
  
  const payload: RefreshTokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    type: 'refresh',
    jti,
  };

  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiry as StringValue,
    issuer: config.jwt.issuer,
  };

  const token = jwt.sign(payload, config.jwt.refreshSecret, options);

  // Calculate expiration date
  const expiresAt = new Date();
  // Parse expiry string (e.g., "30d" = 30 days)
  const match = config.jwt.refreshExpiry.match(/^(\d+)([dhms])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 'd':
        expiresAt.setDate(expiresAt.getDate() + value);
        break;
      case 'h':
        expiresAt.setHours(expiresAt.getHours() + value);
        break;
      case 'm':
        expiresAt.setMinutes(expiresAt.getMinutes() + value);
        break;
      case 's':
        expiresAt.setSeconds(expiresAt.getSeconds() + value);
        break;
    }
  }

  return { token, jti, expiresAt };
};

/**
 * Verify access token
 * @param token - JWT token to verify
 * @returns Decoded access token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as AccessTokenPayload;

    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded refresh token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
    }) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    if (!decoded.jti) {
      throw new AuthenticationError('Token missing JTI');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Generate email verification token
 * @param userId - User ID
 * @param email - User email
 * @returns JWT email verification token
 */
export const generateEmailVerificationToken = (
  userId: string,
  email: string
): string => {
  const payload: EmailVerificationTokenPayload = {
    userId,
    email,
    type: 'email_verification',
  };

  const options: SignOptions = {
    expiresIn: (config.jwt.emailVerificationExpiry || '24h') as StringValue,
    issuer: config.jwt.issuer,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Verify email verification token
 * @param token - JWT email verification token
 * @returns Decoded token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
export const verifyEmailVerificationToken = (
  token: string
): EmailVerificationTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as EmailVerificationTokenPayload;

    if (decoded.type !== 'email_verification') {
      throw new AuthenticationError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Email verification token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid email verification token');
    }
    throw error;
  }
};

/**
 * Generate password reset token
 * @param userId - User ID
 * @param email - User email
 * @returns JWT password reset token
 */
export const generatePasswordResetToken = (
  userId: string,
  email: string
): string => {
  const payload: PasswordResetTokenPayload = {
    userId,
    email,
    type: 'password_reset',
  };

  const options: SignOptions = {
    expiresIn: (config.jwt.passwordResetExpiry || '1h') as StringValue,
    issuer: config.jwt.issuer,
  };

  return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Verify password reset token
 * @param token - JWT password reset token
 * @returns Decoded token payload
 * @throws {AuthenticationError} If token is invalid or expired
 */
export const verifyPasswordResetToken = (
  token: string
): PasswordResetTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as PasswordResetTokenPayload;

    if (decoded.type !== 'password_reset') {
      throw new AuthenticationError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Password reset token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid password reset token');
    }
    throw error;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};