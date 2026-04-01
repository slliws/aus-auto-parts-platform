/**
 * Unit tests for auth.service.ts
 * Tests authentication service business logic with mocked dependencies
 */

import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import prisma from '../../../models/prisma';
import { logger } from '../../../utils/logger';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from '../../../utils/jwt';
import authService, {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  RegisterDTO,
  LoginDTO,
  ResetPasswordDTO,
} from '../../../services/auth.service';

// Mock dependencies
jest.mock('../../../models/prisma');
jest.mock('../../../utils/logger');
jest.mock('../../../utils/errors');
jest.mock('../../../utils/jwt');
jest.mock('bcryptjs');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock JWT functions
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;
const mockVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;
const mockGenerateEmailVerificationToken = generateEmailVerificationToken as jest.MockedFunction<typeof generateEmailVerificationToken>;
const mockVerifyEmailVerificationToken = verifyEmailVerificationToken as jest.MockedFunction<typeof verifyEmailVerificationToken>;
const mockGeneratePasswordResetToken = generatePasswordResetToken as jest.MockedFunction<typeof generatePasswordResetToken>;
const mockVerifyPasswordResetToken = verifyPasswordResetToken as jest.MockedFunction<typeof verifyPasswordResetToken>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterDTO: RegisterDTO = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      tenantId: 'tenant-123',
    };

    it('should register a new user successfully', async () => {
      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        email: 'tenant@example.com',
        phone: '0400000000',
        is_active: true,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        password_hash: 'hashed-password',
        role: 'VIEWER',
        is_active: true,
        email_verified: false,
        tenant_id: 'tenant-123',
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as any);
      mockPrisma.user.create.mockResolvedValue(mockUser as any);
      mockGenerateEmailVerificationToken.mockReturnValue('verification-token');
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const result = await register(validRegisterDTO);

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          tenant_id: 'tenant-123',
        },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          tenant_id: 'tenant-123',
          email: 'test@example.com',
          password_hash: 'hashed-password',
          first_name: 'John',
          last_name: 'Doe',
          role: 'VIEWER',
          is_active: true,
          email_verified: false,
        },
      });
      expect(mockGenerateEmailVerificationToken).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User registered successfully', {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
      });

      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'VIEWER',
          is_active: true,
          email_verified: false,
          tenant_id: 'tenant-123',
        },
        verificationToken: 'verification-token',
      });
    });

    it('should throw NotFoundError if tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(register(validRegisterDTO)).rejects.toThrow(NotFoundError);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
      });
    });

    it('should throw ValidationError if tenant is not active', async () => {
      const inactiveTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        email: 'tenant@example.com',
        phone: '0400000000',
        is_active: false,
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(inactiveTenant);

      await expect(register(validRegisterDTO)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if user with email already exists', async () => {
      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        email: 'tenant@example.com',
        phone: '0400000000',
        is_active: true,
      };

      const existingUser = {
        id: 'existing-user',
        email: 'test@example.com',
        tenant_id: 'tenant-123',
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.user.findFirst.mockResolvedValue(existingUser as any);

      await expect(register(validRegisterDTO)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    const validLoginDTO: LoginDTO = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'ADMIN',
        is_active: true,
        email_verified: true,
        tenant_id: 'tenant-123',
      };

      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        email: 'tenant@example.com',
        phone: '0400000000',
        is_active: true,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockBcrypt.compare.mockResolvedValue(true as any);
      mockGenerateAccessToken.mockReturnValue('access-token');
      mockGenerateRefreshToken.mockReturnValue({
        token: 'refresh-token',
        jti: 'jti-123',
        expiresAt: new Date(),
      });
      mockPrisma.refreshToken.create.mockResolvedValue({} as any);
      mockPrisma.user.update.mockResolvedValue(mockUser as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const result = await login(validLoginDTO);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          tenant_id: undefined,
        },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(mockUser, mockTenant);
      expect(mockGenerateRefreshToken).toHaveBeenCalledWith(mockUser, mockTenant);
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { last_login_at: expect.any(Date) },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User logged in successfully', {
        userId: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'ADMIN',
          is_active: true,
          email_verified: true,
          tenant_id: 'tenant-123',
        },
      });
    });

    it('should throw AuthenticationError if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(login(validLoginDTO)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if password is invalid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        tenant_id: 'tenant-123',
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as any);

      await expect(login(validLoginDTO)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: false,
        tenant_id: 'tenant-123',
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as any);

      await expect(login(validLoginDTO)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if email is not verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: true,
        email_verified: false,
        tenant_id: 'tenant-123',
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as any);

      await expect(login(validLoginDTO)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if tenant is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        is_active: true,
        email_verified: true,
        tenant_id: 'tenant-123',
      };

      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        email: 'tenant@example.com',
        phone: '0400000000',
        is_active: false,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockBcrypt.compare.mockResolvedValue(true as any);

      await expect(login(validLoginDTO)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        jti: 'jti-123',
      };

      const mockTokenRecord = {
        id: 'token-123',
        jti: 'jti-123',
        revoked: false,
        expires_at: new Date(Date.now() + 1000000), // Future date
      };

      const mockUser = {
        id: 'user-123',
        is_active: true,
        tenant_id: 'tenant-123',
      };

      const mockTenant = {
        id: 'tenant-123',
        is_active: true,
      };

      mockVerifyRefreshToken.mockReturnValue(payload as any);
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant as any);
      mockGenerateAccessToken.mockReturnValue('new-access-token');

      const result = await refreshAccessToken('refresh-token');

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { jti: 'jti-123' },
      });
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(mockUser, mockTenant);
      expect(result).toEqual({
        accessToken: 'new-access-token',
      });
    });

    it('should throw AuthenticationError if token record not found', async () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        jti: 'jti-123',
      };

      mockVerifyRefreshToken.mockReturnValue(payload as any);
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(refreshAccessToken('refresh-token')).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if token is revoked', async () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        jti: 'jti-123',
      };

      const mockTokenRecord = {
        id: 'token-123',
        jti: 'jti-123',
        revoked: true,
        expires_at: new Date(Date.now() + 1000000),
      };

      mockVerifyRefreshToken.mockReturnValue(payload as any);
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord as any);

      await expect(refreshAccessToken('refresh-token')).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if token is expired', async () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        jti: 'jti-123',
      };

      const mockTokenRecord = {
        id: 'token-123',
        jti: 'jti-123',
        revoked: false,
        expires_at: new Date(Date.now() - 1000000), // Past date
      };

      mockVerifyRefreshToken.mockReturnValue(payload as any);
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord as any);

      await expect(refreshAccessToken('refresh-token')).rejects.toThrow(AuthenticationError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_verified: false,
        tenant_id: 'tenant-123',
      };

      mockVerifyEmailVerificationToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, email_verified: true } as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      await verifyEmail('verification-token');

      expect(mockVerifyEmailVerificationToken).toHaveBeenCalledWith('verification-token');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { email_verified: true },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Email verified successfully', {
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should not throw error if email is already verified', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_verified: true,
        tenant_id: 'tenant-123',
      };

      mockVerifyEmailVerificationToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(verifyEmail('verification-token')).resolves.not.toThrow();

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if user not found', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      mockVerifyEmailVerificationToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(verifyEmail('verification-token')).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthenticationError if email does not match', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: 'different@example.com',
        email_verified: false,
        tenant_id: 'tenant-123',
      };

      mockVerifyEmailVerificationToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(verifyEmail('verification-token')).rejects.toThrow(AuthenticationError);
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate reset token for existing user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        tenant_id: 'tenant-123',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockGeneratePasswordResetToken.mockReturnValue('reset-token');
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const result = await requestPasswordReset('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(result).toBe('reset-token');
    });

    it('should return dummy token for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockGeneratePasswordResetToken.mockReturnValue('dummy-token');

      const result = await requestPasswordReset('nonexistent@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(mockGeneratePasswordResetToken).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000', 'nonexistent@example.com');
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
      expect(result).toBe('dummy-token');
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDTO: ResetPasswordDTO = {
      token: 'reset-token',
      newPassword: 'newpassword123',
    };

    it('should reset password successfully', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        tenant_id: 'tenant-123',
      };

      mockVerifyPasswordResetToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockBcrypt.hash.mockResolvedValue('new-hashed-password' as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, password_hash: 'new-hashed-password' } as any);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      await resetPassword(resetPasswordDTO);

      expect(mockVerifyPasswordResetToken).toHaveBeenCalledWith('reset-token');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { password_hash: 'new-hashed-password' },
      });
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-123',
          revoked: false,
        },
        data: { revoked: true },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Password reset successfully', {
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should throw NotFoundError if user not found', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      mockVerifyPasswordResetToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(resetPassword(resetPasswordDTO)).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthenticationError if email does not match', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: 'different@example.com',
        tenant_id: 'tenant-123',
      };

      mockVerifyPasswordResetToken.mockReturnValue(payload as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(resetPassword(resetPasswordDTO)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token successfully', async () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        jti: 'jti-123',
      };

      const mockTokenRecord = {
        id: 'token-123',
        jti: 'jti-123',
        revoked: false,
      };

      mockVerifyRefreshToken.mockReturnValue(payload as any);
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord as any);
      mockPrisma.refreshToken.update.mockResolvedValue({ ...mockTokenRecord, revoked: true } as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      await logout('refresh-token');

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { jti: 'jti-123' },
      });
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { jti: 'jti-123' },
        data: { revoked: true },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User logged out successfully', {
        userId: 'user-123',
        tenantId: 'tenant-123',
      });
    });

    it('should not throw error if token record not found', async () => {
      const payload = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        jti: 'jti-123',
      };

      mockVerifyRefreshToken.mockReturnValue(payload as any);
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(logout('refresh-token')).resolves.not.toThrow();

      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });
});