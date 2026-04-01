/**
 * Customers service
 * Handles business logic for customer management operations
 * Implements CRUD operations with multi-tenant isolation
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/errors';
import { Customer, Prisma } from '@prisma/client';

/**
 * Interface for creating a new customer
 */
export interface CreateCustomerDTO {
  tenantId: string;
  customerType: 'RETAIL' | 'TRADE' | 'WHOLESALE';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile?: string;
  abn?: string;
  companyName?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  notes?: string;
}

/**
 * Interface for updating a customer
 */
export interface UpdateCustomerDTO {
  customerType?: 'RETAIL' | 'TRADE' | 'WHOLESALE';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  abn?: string;
  companyName?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Interface for customer search/filter parameters
 */
export interface CustomerFilters {
  search?: string;
  customerType?: 'RETAIL' | 'TRADE' | 'WHOLESALE';
  state?: string;
  postcode?: string;
  isActive?: boolean;
  hasOrders?: boolean;
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface for paginated response
 */
export interface PaginatedCustomersResponse {
  data: CustomerWithStats[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Customer with statistics
 */
export interface CustomerWithStats extends Customer {
  _count?: {
    orders: number;
    quotes: number;
  };
  totalSpent?: number;
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
        changes: (data.changes || null) as Prisma.InputJsonValue,
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
 * Get all customers with pagination and filtering
 */
export const getCustomers = async (
  tenantId: string,
  filters: CustomerFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedCustomersResponse> => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause with tenant isolation
  const where: Prisma.CustomerWhereInput = {
    tenant_id: tenantId,
  };

  // Apply filters
  if (filters.search) {
    where.OR = [
      { first_name: { contains: filters.search, mode: 'insensitive' } },
      { last_name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
      { mobile: { contains: filters.search, mode: 'insensitive' } },
      { company_name: { contains: filters.search, mode: 'insensitive' } },
      { abn: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.customerType) {
    where.customer_type = filters.customerType as any;
  }

  if (filters.state) {
    where.state = { equals: filters.state, mode: 'insensitive' };
  }

  if (filters.postcode) {
    where.postcode = filters.postcode;
  }

  if (filters.isActive !== undefined) {
    where.is_active = filters.isActive;
  }

  if (filters.hasOrders !== undefined) {
    if (filters.hasOrders) {
      where.orders = { some: {} };
    } else {
      where.orders = { none: {} };
    }
  }

  // Execute query with pagination
  const [customers, totalItems] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            quotes: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  // Calculate total spent for each customer
  const customersWithStats: CustomerWithStats[] = await Promise.all(
    customers.map(async (customer) => {
      const orderStats = await prisma.order.aggregate({
        where: {
          customer_id: customer.id,
          tenant_id: tenantId,
          payment_status: 'COMPLETED',
        },
        _sum: {
          total_amount: true,
        },
      });

      return {
        ...customer,
        totalSpent: orderStats._sum.total_amount?.toNumber() || 0,
      };
    })
  );

  const totalPages = Math.ceil(totalItems / limit);

  logger.info('Customers retrieved', {
    tenantId,
    count: customers.length,
    totalItems,
    page,
    userId,
  });

  return {
    data: customersWithStats,
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (
  customerId: string,
  tenantId: string,
  userId?: string
): Promise<CustomerWithStats> => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenant_id: tenantId, // Ensure tenant isolation
    },
    include: {
      _count: {
        select: {
          orders: true,
          quotes: true,
          communications: true,
          warranty_claims: true,
        },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Calculate total spent
  const orderStats = await prisma.order.aggregate({
    where: {
      customer_id: customerId,
      tenant_id: tenantId,
      payment_status: 'COMPLETED',
    },
    _sum: {
      total_amount: true,
    },
  });

  const customerWithStats: CustomerWithStats = {
    ...customer,
    totalSpent: orderStats._sum.total_amount?.toNumber() || 0,
  };

  logger.info('Customer retrieved', { customerId, tenantId, userId });

  return customerWithStats;
};

/**
 * Create new customer
 */
export const createCustomer = async (
  data: CreateCustomerDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Customer> => {
  // Check if customer with email already exists for this tenant
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      tenant_id: data.tenantId,
      email: data.email,
    },
  });

  if (existingCustomer) {
    throw new ConflictError('Customer with this email already exists');
  }

  // Validate ABN for trade/wholesale customers
  if ((data.customerType === 'TRADE' || data.customerType === 'WHOLESALE') && !data.abn) {
    throw new ValidationError('ABN is required for trade and wholesale customers');
  }

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      tenant_id: data.tenantId,
      customer_type: data.customerType as any,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile || null,
      abn: data.abn || null,
      company_name: data.companyName || null,
      address: data.address || null,
      suburb: data.suburb || null,
      state: data.state || null,
      postcode: data.postcode || null,
      notes: data.notes || null,
      is_active: true,
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'CUSTOMER_CREATE',
    userId,
    tenantId: data.tenantId,
    resourceType: 'Customer',
    resourceId: customer.id,
    changes: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      customerType: customer.customer_type,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Customer created', {
    customerId: customer.id,
    email: customer.email,
    tenantId: data.tenantId,
    userId,
  });

  return customer;
};

/**
 * Update customer
 */
export const updateCustomer = async (
  customerId: string,
  tenantId: string,
  data: UpdateCustomerDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Customer> => {
  // Check if customer exists and belongs to tenant
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenant_id: tenantId,
    },
  });

  if (!existingCustomer) {
    throw new NotFoundError('Customer not found');
  }

  // If updating email, check uniqueness
  if (data.email && data.email !== existingCustomer.email) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        tenant_id: tenantId,
        email: data.email,
        id: { not: customerId },
      },
    });

    if (duplicate) {
      throw new ConflictError('Customer with this email already exists');
    }
  }

  // Validate ABN requirement for trade/wholesale
  const newCustomerType = data.customerType || existingCustomer.customer_type;
  if ((newCustomerType === 'TRADE' || newCustomerType === 'WHOLESALE')) {
    const newAbn = data.abn !== undefined ? data.abn : existingCustomer.abn;
    if (!newAbn) {
      throw new ValidationError('ABN is required for trade and wholesale customers');
    }
  }

  // Prepare update data
  const updateData: Prisma.CustomerUpdateInput = {};
  if (data.customerType) updateData.customer_type = data.customerType as any;
  if (data.firstName) updateData.first_name = data.firstName;
  if (data.lastName) updateData.last_name = data.lastName;
  if (data.email) updateData.email = data.email;
  if (data.phone) updateData.phone = data.phone;
  if (data.mobile !== undefined) updateData.mobile = data.mobile;
  if (data.abn !== undefined) updateData.abn = data.abn;
  if (data.companyName !== undefined) updateData.company_name = data.companyName;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.suburb !== undefined) updateData.suburb = data.suburb;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.postcode !== undefined) updateData.postcode = data.postcode;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  // Update customer
  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: updateData,
  });

  // Create audit log
  await createAuditLog({
    action: 'CUSTOMER_UPDATE',
    userId,
    tenantId,
    resourceType: 'Customer',
    resourceId: customerId,
    changes: data as Record<string, unknown>,
    ipAddress,
    userAgent,
  });

  logger.info('Customer updated', {
    customerId,
    tenantId,
    userId,
  });

  return updatedCustomer;
};

/**
 * Delete customer (soft delete - set is_active to false)
 */
export const deleteCustomer = async (
  customerId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Check if customer exists and belongs to tenant
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenant_id: tenantId,
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Check if customer has active orders
  const activeOrdersCount = await prisma.order.count({
    where: {
      customer_id: customerId,
      tenant_id: tenantId,
      status: {
        in: ['PENDING', 'PICKING', 'PACKED', 'SHIPPED'],
      },
    },
  });

  if (activeOrdersCount > 0) {
    throw new ValidationError(
      'Cannot delete customer with active orders. Set as inactive instead.'
    );
  }

  // Soft delete - set is_active to false
  await prisma.customer.update({
    where: { id: customerId },
    data: { is_active: false },
  });

  // Create audit log
  await createAuditLog({
    action: 'CUSTOMER_DELETE',
    userId,
    tenantId,
    resourceType: 'Customer',
    resourceId: customerId,
    changes: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Customer deleted (soft delete)', {
    customerId,
    tenantId,
    userId,
  });
};

/**
 * Search customers by query
 */
export const searchCustomers = async (
  tenantId: string,
  query: string,
  filters: CustomerFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedCustomersResponse> => {
  // Use the getCustomers function with search filter
  return getCustomers(
    tenantId,
    { ...filters, search: query },
    pagination,
    userId
  );
};

/**
 * Get customer's order history
 */
export const getCustomerOrders = async (
  customerId: string,
  tenantId: string,
  pagination: PaginationParams = {},
  userId?: string
) => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  // Verify customer belongs to tenant
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      tenant_id: tenantId,
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const [orders, totalItems] = await Promise.all([
    prisma.order.findMany({
      where: { customer_id: customerId },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        order_items: {
          include: {
            part: true,
          },
        },
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.count({ where: { customer_id: customerId } }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  logger.info('Customer orders retrieved', {
    customerId,
    tenantId,
    count: orders.length,
    userId,
  });

  return {
    data: orders,
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/**
 * Get customer statistics
 */
export const getCustomerStats = async (
  tenantId: string,
  userId?: string
) => {
  const [
    totalCustomers,
    activeCustomers,
    retailCount,
    tradeCount,
    wholesaleCount,
    newThisMonth,
  ] = await Promise.all([
    prisma.customer.count({ where: { tenant_id: tenantId } }),
    prisma.customer.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.customer.count({ where: { tenant_id: tenantId, customer_type: 'RETAIL' } }),
    prisma.customer.count({ where: { tenant_id: tenantId, customer_type: 'TRADE' } }),
    prisma.customer.count({ where: { tenant_id: tenantId, customer_type: 'WHOLESALE' } }),
    prisma.customer.count({
      where: {
        tenant_id: tenantId,
        created_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  logger.info('Customer statistics retrieved', { tenantId, userId });

  return {
    totalCustomers,
    activeCustomers,
    inactiveCustomers: totalCustomers - activeCustomers,
    retailCount,
    tradeCount,
    wholesaleCount,
    newThisMonth,
  };
};

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