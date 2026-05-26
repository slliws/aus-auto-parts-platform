/**
 * User service
 * Handles business logic for user management operations
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, AuthenticationError, AuthorizationError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import config from '../config';

/**
 * Type definitions for user operations
 */
export interface CreateUserInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  phone?: string;
}

export interface UpdateUserInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ListUsersOptions {
  page?: number;
  per_page?: number;
  role?: UserRole;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Create new user
 */
export const createUser = async (
  tenantId: string,
  userData: CreateUserInput
): Promise<any> => {
  try {
    logger.info('Creating new user', { tenantId, email: userData.email });

    // Check if email already exists within tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        tenant_id: tenantId,
        email: userData.email,
      },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists in this tenant');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, config.security.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenant_id: tenantId,
        email: userData.email,
        password_hash: passwordHash,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role,
        is_active: true,
        email_verified: false,
      },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: user.id,
        action: 'CREATE',
        resource_type: 'User',
        resource_id: user.id,
        changes: {
          created: {
            email: user.email,
            role: user.role,
          },
        },
      },
    });

    logger.info('User created successfully', { tenantId, userId: user.id });
    return user;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  tenantId: string,
  userId: string
): Promise<any> => {
  try {
    logger.info('Fetching user by ID', { tenantId, userId });

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    logger.info('User fetched successfully', { tenantId, userId });
    return user;
  } catch (error) {
    logger.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * List users with pagination and filtering
 */
export const listUsers = async (
  tenantId: string,
  options: ListUsersOptions = {}
): Promise<any> => {
  try {
    logger.info('Listing users', { tenantId, options });

    const {
      page = 1,
      per_page = 20,
      role,
      is_active,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = options;

    // Calculate pagination
    const skip = (page - 1) * per_page;
    const take = per_page;

    // Build where clause
    const where: any = {
      tenant_id: tenantId,
    };

    if (role) {
      where.role = role;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          tenant_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
          email_verified: true,
          last_login_at: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / per_page);

    logger.info('Users listed successfully', { tenantId, count: users.length, total });

    return {
      data: users,
      pagination: {
        page,
        per_page,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  } catch (error) {
    logger.error('Error listing users:', error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (
  tenantId: string,
  userId: string,
  updateData: UpdateUserInput
): Promise<any> => {
  try {
    logger.info('Updating user', { tenantId, userId });

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
    });

    if (!existingUser) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    // Check email uniqueness if changed
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          tenant_id: tenantId,
          email: updateData.email,
          id: { not: userId },
        },
      });

      if (emailExists) {
        throw new ConflictError('A user with this email already exists in this tenant');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        tenant_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action: 'UPDATE',
        resource_type: 'User',
        resource_id: userId,
        changes: {
          before: {
            email: existingUser.email,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
          },
          after: {
            email: updateData.email,
            first_name: updateData.first_name,
            last_name: updateData.last_name,
          },
        } as any,
      },
    });

    logger.info('User updated successfully', { tenantId, userId });
    return updatedUser;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (
  tenantId: string,
  userId: string
): Promise<void> => {
  try {
    logger.info('Deleting user', { tenantId, userId });

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    // Soft delete user and revoke all refresh tokens in a transaction
    await prisma.$transaction([
      // Set is_active to false
      prisma.user.update({
        where: { id: userId },
        data: { is_active: false },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
          tenant_id: tenantId,
        },
        data: { revoked: true },
      }),
      // Create audit log
      prisma.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          action: 'DELETE',
          resource_type: 'User',
          resource_id: userId,
          changes: {
            deleted: true,
          },
        },
      }),
    ]);

    logger.info('User deleted successfully', { tenantId, userId });
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Activate user
 */
export const activateUser = async (
  tenantId: string,
  userId: string
): Promise<any> => {
  try {
    logger.info('Activating user', { tenantId, userId });

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    // Activate user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { is_active: true },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action: 'ACTIVATE',
        resource_type: 'User',
        resource_id: userId,
        changes: {
          is_active: true,
        },
      },
    });

    logger.info('User activated successfully', { tenantId, userId });
    return updatedUser;
  } catch (error) {
    logger.error('Error activating user:', error);
    throw error;
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (
  tenantId: string,
  userId: string
): Promise<any> => {
  try {
    logger.info('Deactivating user', { tenantId, userId });

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    // Deactivate user and revoke all refresh tokens in a transaction
    await prisma.$transaction([
      // Set is_active to false
      prisma.user.update({
        where: { id: userId },
        data: { is_active: false },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
          tenant_id: tenantId,
        },
        data: { revoked: true },
      }),
      // Create audit log
      prisma.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          action: 'DEACTIVATE',
          resource_type: 'User',
          resource_id: userId,
          changes: {
            is_active: false,
          },
        },
      }),
    ]);

    logger.info('User deactivated successfully', { tenantId, userId });

    // Return updated user
    return await getUserById(tenantId, userId);
  } catch (error) {
    logger.error('Error deactivating user:', error);
    throw error;
  }
};

/**
 * Change password
 */
export const changePassword = async (
  tenantId: string,
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    logger.info('Changing password', { tenantId, userId });

    // Get user with password hash
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
    });

    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

    // Update password and revoke all refresh tokens in a transaction
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: userId },
        data: { password_hash: newPasswordHash },
      }),
      // Revoke all refresh tokens (force re-login)
      prisma.refreshToken.updateMany({
        where: {
          user_id: userId,
          tenant_id: tenantId,
        },
        data: { revoked: true },
      }),
      // Create audit log
      prisma.auditLog.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          action: 'CHANGE_PASSWORD',
          resource_type: 'User',
          resource_id: userId,
          changes: {
            password_changed: true,
          },
        },
      }),
    ]);

    logger.info('Password changed successfully', { tenantId, userId });
  } catch (error) {
    logger.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateRole = async (
  tenantId: string,
  userId: string,
  newRole: UserRole,
  requestingUserId: string,
  requestingUserRole: UserRole
): Promise<any> => {
  try {
    logger.info('Updating user role', { tenantId, userId, newRole, requestingUserId });

    // Guard: ADMIN cannot change their own role (prevents self-escalation / lockout)
    if (requestingUserId === userId) {
      throw new AuthorizationError('You cannot change your own role');
    }

    // Guard: Only ADMIN can assign the ADMIN role
    if (newRole === UserRole.ADMIN && requestingUserRole !== UserRole.ADMIN) {
      throw new AuthorizationError('Only an ADMIN can assign the ADMIN role');
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenant_id: tenantId,
      },
    });

    if (!existingUser) {
      throw new NotFoundError(`User with ID ${userId} not found in tenant ${tenantId}`);
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        tenant_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action: 'UPDATE_ROLE',
        resource_type: 'User',
        resource_id: userId,
        changes: {
          before: { role: existingUser.role },
          after: { role: newRole },
        },
      },
    });

    logger.info('User role updated successfully', { tenantId, userId, newRole });
    return updatedUser;
  } catch (error) {
    logger.error('Error updating user role:', error);
    throw error;
  }
};

export default {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  changePassword,
  updateRole,
};