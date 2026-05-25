import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, PaginatedResponse } from '../types';
import * as userService from '../services/user.service';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

/**
 * Users controller
 * Handles user management operations within a tenant
 */

/**
 * Get all users in tenant
 * @route GET /api/v1/users
 */
export const getUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const per_page = parseInt(req.query.per_page as string) || 20;

    // Extract filter parameters
    const role = req.query.role as UserRole | undefined;
    const is_active = req.query.is_active ? req.query.is_active === 'true' : undefined;
    const sort_by = (req.query.sort_by as string) || 'created_at';
    const sort_order = (req.query.sort_order as 'asc' | 'desc') || 'desc';

    const result = await userService.listUsers(tenantId, {
      page,
      per_page,
      role,
      is_active,
      sort_by,
      sort_order,
    });

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: result.pagination,
    };

    res.status(200).json(response);
  }
);

/**
 * Get user by ID
 * @route GET /api/v1/users/:id
 */
export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const user = await userService.getUserById(tenantId, id);

    const response: ApiResponse = {
      success: true,
      data: { user },
    };

    res.status(200).json(response);
  }
);

/**
 * Create new user
 * @route POST /api/v1/users
 */
export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const { email, password, first_name, last_name, role, phone } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      const response: ApiResponse = {
        success: false,
        message: 'Missing required fields: email, password, role',
      };
      res.status(400).json(response);
      return;
    }

    const user = await userService.createUser(tenantId, {
      email,
      password,
      first_name,
      last_name,
      role,
      phone,
    });

    const response: ApiResponse = {
      success: true,
      message: 'User created successfully',
      data: { user },
    };

    res.status(201).json(response);
  }
);

/**
 * Update user
 * @route PUT /api/v1/users/:id
 */
export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const { email, first_name, last_name, phone, avatar_url } = req.body;

    const updateData: userService.UpdateUserInput = {};
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await userService.updateUser(tenantId, id, updateData);

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: { user },
    };

    res.status(200).json(response);
  }
);

/**
 * Delete user (soft delete)
 * @route DELETE /api/v1/users/:id
 */
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    await userService.deleteUser(tenantId, id);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
    };

    res.status(200).json(response);
  }
);

/**
 * Activate user account
 * @route PATCH /api/v1/users/:id/activate
 */
export const activateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const user = await userService.activateUser(tenantId, id);

    const response: ApiResponse = {
      success: true,
      message: 'User activated successfully',
      data: { user },
    };

    res.status(200).json(response);
  }
);

/**
 * Deactivate user account
 * @route PATCH /api/v1/users/:id/deactivate
 */
export const deactivateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const user = await userService.deactivateUser(tenantId, id);

    const response: ApiResponse = {
      success: true,
      message: 'User deactivated successfully',
      data: { user },
    };

    res.status(200).json(response);
  }
);

/**
 * Change user password
 * @route PATCH /api/v1/users/:id/change-password
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const { oldPassword, newPassword } = req.body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      const response: ApiResponse = {
        success: false,
        message: 'Missing required fields: oldPassword, newPassword',
      };
      res.status(400).json(response);
      return;
    }

    await userService.changePassword(tenantId, id, oldPassword, newPassword);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    res.status(200).json(response);
  }
);

/**
 * Update user role
 * @route PATCH /api/v1/users/:id/role
 */
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const { role } = req.body;

    // Validate required fields
    if (!role) {
      const response: ApiResponse = {
        success: false,
        message: 'Missing required field: role',
      };
      res.status(400).json(response);
      return;
    }

    const user = await userService.updateRole(tenantId, id, role as UserRole);

    const response: ApiResponse = {
      success: true,
      message: 'User role updated successfully',
      data: { user },
    };

    res.status(200).json(response);
  }
);

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  changePassword,
  updateUserRole,
};
