import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as customersService from '../services/customers.service';
import { logger } from '../utils/logger';

/**
 * Customers controller
 * Handles HTTP requests for customer management
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
 * Get all customers with pagination and filtering
 * @route GET /api/v1/customers
 */
export const getCustomers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Parse filters
    const filters: customersService.CustomerFilters = {};
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.customerType) filters.customerType = req.query.customerType as any;
    if (req.query.state) filters.state = req.query.state as string;
    if (req.query.postcode) filters.postcode = req.query.postcode as string;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.hasOrders !== undefined) filters.hasOrders = req.query.hasOrders === 'true';

    const result = await customersService.getCustomers(
      tenantId,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { customers: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get single customer by ID
 * @route GET /api/v1/customers/:id
 */
export const getCustomerById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const customer = await customersService.getCustomerById(id, tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { customer },
    };

    res.status(200).json(response);
  }
);

/**
 * Create new customer
 * @route POST /api/v1/customers
 */
export const createCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const customerData: customersService.CreateCustomerDTO = {
      tenantId,
      customerType: req.body.customerType,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      mobile: req.body.mobile,
      abn: req.body.abn,
      companyName: req.body.companyName,
      address: req.body.address,
      suburb: req.body.suburb,
      state: req.body.state,
      postcode: req.body.postcode,
      notes: req.body.notes,
    };

    const customer = await customersService.createCustomer(
      customerData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Customer created successfully',
      data: { customer },
    };

    res.status(201).json(response);
  }
);

/**
 * Update existing customer
 * @route PUT /api/v1/customers/:id
 */
export const updateCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const updateData: customersService.UpdateCustomerDTO = {};
    if (req.body.customerType) updateData.customerType = req.body.customerType;
    if (req.body.firstName) updateData.firstName = req.body.firstName;
    if (req.body.lastName) updateData.lastName = req.body.lastName;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.mobile !== undefined) updateData.mobile = req.body.mobile;
    if (req.body.abn !== undefined) updateData.abn = req.body.abn;
    if (req.body.companyName !== undefined) updateData.companyName = req.body.companyName;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.suburb !== undefined) updateData.suburb = req.body.suburb;
    if (req.body.state !== undefined) updateData.state = req.body.state;
    if (req.body.postcode !== undefined) updateData.postcode = req.body.postcode;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    const customer = await customersService.updateCustomer(
      id,
      tenantId,
      updateData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    };

    res.status(200).json(response);
  }
);

/**
 * Delete customer (soft delete)
 * @route DELETE /api/v1/customers/:id
 */
export const deleteCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    await customersService.deleteCustomer(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Customer deleted successfully',
    };

    res.status(200).json(response);
  }
);

/**
 * Search customers
 * @route GET /api/v1/customers/search
 */
export const searchCustomers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;
    const query = req.query.q as string;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    if (!query) {
      const response: ApiResponse = {
        success: false,
        message: 'Search query is required',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Parse filters
    const filters: customersService.CustomerFilters = {};
    if (req.query.customerType) filters.customerType = req.query.customerType as any;
    if (req.query.state) filters.state = req.query.state as string;

    const result = await customersService.searchCustomers(
      tenantId,
      query,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { customers: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get customer's order history
 * @route GET /api/v1/customers/:id/orders
 */
export const getCustomerOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await customersService.getCustomerOrders(
      id,
      tenantId,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: { orders: result.data },
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get customer statistics
 * @route GET /api/v1/customers/stats
 */
export const getCustomerStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const stats = await customersService.getCustomerStats(tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { stats },
    };

    res.status(200).json(response);
  }
);

export default {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerOrders,
  getCustomerStats,
};