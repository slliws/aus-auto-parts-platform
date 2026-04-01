/**
 * Orders service
 * Handles order CRUD operations with multi-tenancy, GST calculations,
 * order number generation, status transitions, and inventory management
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AppError,
} from '../utils/errors';
import { Order, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

/**
 * Interface for creating a new order
 */
export interface CreateOrderDTO {
  tenantId: string;
  customerId: string;
  userId: string;
  quoteId?: string;
  orderItems: OrderItemDTO[];
  notes?: string;
  internalNotes?: string;
}

/**
 * Interface for order item data
 */
export interface OrderItemDTO {
  partId: string;
  quantity: number;
  unitPrice?: number; // Optional, will use part sell_price if not provided
}

/**
 * Interface for updating an order
 */
export interface UpdateOrderDTO {
  notes?: string;
  internalNotes?: string;
  status?: OrderStatus;
}

/**
 * Interface for order filters
 */
export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
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
export interface PaginatedOrdersResponse {
  data: OrderWithDetails[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Order with full details
 */
export interface OrderWithDetails extends Omit<Order, 'subtotal_amount' | 'gst_amount' | 'total_amount'> {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total_price: number;
    part: {
      id: string;
      part_number: string;
      name: string;
      condition: string;
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    payment_status: PaymentStatus;
    payment_date: Date | null;
  }>;
  _count?: {
    order_items: number;
    payments: number;
    shipments: number;
  };
  subtotal_amount: number;
  gst_amount: number;
  total_amount: number;
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
 * Generate unique order number for a tenant
 */
const generateOrderNumber = async (tenantId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `ORD-${currentYear}-`;

  // Find the highest order number for this tenant this year
  const lastOrder = await prisma.order.findFirst({
    where: {
      tenant_id: tenantId,
      order_number: {
        startsWith: prefix,
      },
    },
    orderBy: {
      order_number: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.order_number.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
};

/**
 * Calculate GST for an amount (10% for Australia)
 */
const calculateGST = (amount: number): number => {
  return Math.round(amount * 0.1 * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate order totals from order items
 */
const calculateOrderTotals = (orderItems: Array<{
  quantity: number;
  unit_price: number;
  gst_amount: number;
}>): { subtotal: number; gstAmount: number; total: number } => {
  const subtotal = orderItems.reduce((sum, item) =>
    sum + (item.quantity * item.unit_price), 0
  );

  const gstAmount = orderItems.reduce((sum, item) =>
    sum + (item.quantity * item.gst_amount), 0
  );

  const total = subtotal + gstAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Validate order items and check inventory
 */
const validateOrderItems = async (
  items: OrderItemDTO[],
  tenantId: string
): Promise<Array<{
  partId: string;
  part: any;
  quantity: number;
  unitPrice: number;
  gstAmount: number;
  totalPrice: number;
}>> => {
  if (!items || items.length === 0) {
    throw new ValidationError('Order must contain at least one item');
  }

  const validatedItems: Array<{
    partId: string;
    part: any;
    quantity: number;
    unitPrice: number;
    gstAmount: number;
    totalPrice: number;
  }> = [];

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new ValidationError('Order item quantity must be greater than 0');
    }

    // Get part details
    const part = await prisma.part.findFirst({
      where: {
        id: item.partId,
        tenant_id: tenantId,
        is_available: true,
      },
    });

    if (!part) {
      throw new ValidationError(`Part not found or not available: ${item.partId}`);
    }

    // Check stock availability
    if (part.stock_quantity < item.quantity) {
      throw new ValidationError(
        `Insufficient stock for part ${part.part_number}. Available: ${part.stock_quantity}, Requested: ${item.quantity}`
      );
    }

    // Use provided unit price or part's sell price
    const unitPrice = item.unitPrice || Number(part.sell_price);

    // Calculate GST (parts can be GST inclusive or exclusive)
    let gstAmount: number;
    if (part.gst_inclusive) {
      // GST is included in the sell price
      gstAmount = calculateGST(unitPrice / 1.1);
    } else {
      // GST needs to be added
      gstAmount = calculateGST(unitPrice);
    }

    validatedItems.push({
      partId: item.partId,
      part,
      quantity: item.quantity,
      unitPrice,
      gstAmount,
      totalPrice: (unitPrice + gstAmount) * item.quantity,
    });
  }

  return validatedItems;
};

/**
 * Update inventory for order items
 */
const updateInventory = async (
  items: Array<{
    partId: string;
    quantity: number;
    part: any;
  }>,
  operation: 'reduce' | 'restore'
): Promise<void> => {
  for (const item of items) {
    const quantityChange = operation === 'reduce' ? -item.quantity : item.quantity;

    await prisma.part.update({
      where: { id: item.partId },
      data: {
        stock_quantity: {
          increment: quantityChange,
        },
      },
    });

    logger.info('Inventory updated', {
      partId: item.partId,
      operation,
      quantity: item.quantity,
      newStock: item.part.stock_quantity + quantityChange,
    });
  }
};

/**
 * Get all orders with pagination and filtering
 */
export const getOrders = async (
  tenantId: string,
  filters: OrderFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedOrdersResponse> => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause with tenant isolation
  const where: Prisma.OrderWhereInput = {
    tenant_id: tenantId,
  };

  // Apply filters
  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.paymentStatus) {
    where.payment_status = filters.paymentStatus;
  }

  if (filters.customerId) {
    where.customer_id = filters.customerId;
  }

  if (filters.userId) {
    where.user_id = filters.userId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.created_at = {};
    if (filters.dateFrom) where.created_at.gte = filters.dateFrom;
    if (filters.dateTo) where.created_at.lte = filters.dateTo;
  }

  if (filters.minAmount || filters.maxAmount) {
    where.total_amount = {};
    if (filters.minAmount) where.total_amount.gte = filters.minAmount;
    if (filters.maxAmount) where.total_amount.lte = filters.maxAmount;
  }

  if (filters.search) {
    where.OR = [
      { order_number: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
      { internal_notes: { contains: filters.search, mode: 'insensitive' } },
      {
        customer: {
          OR: [
            { first_name: { contains: filters.search, mode: 'insensitive' } },
            { last_name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  // Execute query with pagination
  const [orders, totalItems] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        order_items: {
          include: {
            part: {
              select: {
                id: true,
                part_number: true,
                name: true,
                condition: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            payment_status: true,
            payment_date: true,
          },
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            order_items: true,
            payments: true,
            shipments: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  logger.info('Orders retrieved', {
    tenantId,
    count: orders.length,
    totalItems,
    page,
    userId,
  });

  return {
    data: orders as unknown as OrderWithDetails[],
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/**
 * Get order by ID
 */
export const getOrderById = async (
  orderId: string,
  tenantId: string,
  userId?: string
): Promise<OrderWithDetails> => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenant_id: tenantId, // Ensure tenant isolation
    },
    include: {
      customer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      order_items: {
        include: {
          part: {
            select: {
              id: true,
              part_number: true,
              name: true,
              condition: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          payment_status: true,
          payment_date: true,
        },
        orderBy: { created_at: 'desc' },
      },
      quote: {
        select: {
          id: true,
          quote_number: true,
        },
      },
      _count: {
        select: {
          order_items: true,
          payments: true,
          shipments: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  logger.info('Order retrieved', { orderId, tenantId, userId });

  return order as unknown as OrderWithDetails;
};

/**
 * Create new order
 */
export const createOrder = async (
  data: CreateOrderDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<OrderWithDetails> => {
  // Validate order items and check inventory
  const validatedItems = await validateOrderItems(data.orderItems, data.tenantId);

  // Check if customer exists and belongs to tenant
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      tenant_id: data.tenantId,
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Check if user exists and belongs to tenant
  const user = await prisma.user.findFirst({
    where: {
      id: data.userId,
      tenant_id: data.tenantId,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check quote if provided
  if (data.quoteId) {
    const quote = await prisma.quote.findFirst({
      where: {
        id: data.quoteId,
        tenant_id: data.tenantId,
        customer_id: data.customerId,
      },
    });

    if (!quote) {
      throw new NotFoundError('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new ValidationError('Quote must be accepted before creating order');
    }
  }

  // Generate order number
  const orderNumber = await generateOrderNumber(data.tenantId);

  // Calculate totals
  const totals = calculateOrderTotals(validatedItems.map(item => ({
    quantity: item.quantity,
    unit_price: item.unitPrice,
    gst_amount: item.gstAmount,
  })));

  // Create order in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        tenant_id: data.tenantId,
        customer_id: data.customerId,
        user_id: data.userId,
        quote_id: data.quoteId,
        order_number: orderNumber,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        subtotal_amount: totals.subtotal,
        gst_amount: totals.gstAmount,
        total_amount: totals.total,
        notes: data.notes,
        internal_notes: data.internalNotes,
      },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        order_items: {
          include: {
            part: {
              select: {
                id: true,
                part_number: true,
                name: true,
                condition: true,
              },
            },
          },
        },
        payments: true,
        _count: {
          select: {
            order_items: true,
            payments: true,
            shipments: true,
          },
        },
      },
    });

    // Create order items
    const orderItems = [];
    for (const item of validatedItems) {
      const orderItem = await tx.orderItem.create({
        data: {
          order_id: order.id,
          part_id: item.partId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          gst_amount: item.gstAmount,
          total_price: item.totalPrice,
        },
        include: {
          part: {
            select: {
              id: true,
              part_number: true,
              name: true,
              condition: true,
            },
          },
        },
      });
      orderItems.push(orderItem);
    }

    // Update order with order_items
    const orderWithItems = { ...order, order_items: orderItems };

    // Reduce inventory
    await updateInventory(validatedItems.map(item => ({
      partId: item.partId,
      quantity: item.quantity,
      part: item.part,
    })), 'reduce');

    return orderWithItems;
  });

  // Create audit log
  await createAuditLog({
    action: 'ORDER_CREATE',
    userId,
    tenantId: data.tenantId,
    resourceType: 'Order',
    resourceId: result.id,
    changes: {
      orderNumber: result.order_number,
      customerId: result.customer_id,
      totalAmount: result.total_amount,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Order created', {
    orderId: result.id,
    orderNumber: result.order_number,
    customerId: data.customerId,
    tenantId: data.tenantId,
    userId,
  });

  return result as unknown as OrderWithDetails;
};

/**
 * Update order
 */
export const updateOrder = async (
  orderId: string,
  tenantId: string,
  data: UpdateOrderDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<OrderWithDetails> => {
  // Check if order exists and belongs to tenant
  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenant_id: tenantId,
    },
  });

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Validate status transition
  if (data.status) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
      [OrderStatus.PICKING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
      [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[existingOrder.status].includes(data.status)) {
      throw new ValidationError(
        `Invalid status transition from ${existingOrder.status} to ${data.status}`
      );
    }

    // If cancelling order, restock inventory
    if (data.status === OrderStatus.CANCELLED && existingOrder.status !== OrderStatus.CANCELLED) {
      const orderItems = await prisma.orderItem.findMany({
        where: { order_id: orderId },
        include: { part: true },
      });

      await updateInventory(
        orderItems.map(item => ({
          partId: item.part_id,
          quantity: item.quantity,
          part: item.part,
        })),
        'restore'
      );
    }
  }

  // Prepare update data
  const updateData: Prisma.OrderUpdateInput = {};
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.internalNotes !== undefined) updateData.internal_notes = data.internalNotes;
  if (data.status) updateData.status = data.status;

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      customer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      order_items: {
        include: {
          part: {
            select: {
              id: true,
              part_number: true,
              name: true,
              condition: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          payment_status: true,
          payment_date: true,
        },
        orderBy: { created_at: 'desc' },
      },
      _count: {
        select: {
          order_items: true,
          payments: true,
          shipments: true,
        },
      },
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'ORDER_UPDATE',
    userId,
    tenantId,
    resourceType: 'Order',
    resourceId: orderId,
    changes: data as Record<string, unknown>,
    ipAddress,
    userAgent,
  });

  logger.info('Order updated', {
    orderId,
    tenantId,
    userId,
  });

  return updatedOrder as unknown as OrderWithDetails;
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  orderId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<OrderWithDetails> => {
  // Check if order exists and belongs to tenant
  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenant_id: tenantId,
    },
    include: {
      order_items: {
        include: { part: true },
      },
    },
  });

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  if (existingOrder.status === OrderStatus.CANCELLED) {
    throw new ValidationError('Order is already cancelled');
  }

  if (existingOrder.status === OrderStatus.DELIVERED) {
    throw new ValidationError('Cannot cancel a delivered order');
  }

  // Check if order has completed payments
  const completedPayments = await prisma.payment.count({
    where: {
      order_id: orderId,
      payment_status: PaymentStatus.COMPLETED,
    },
  });

  if (completedPayments > 0) {
    throw new ValidationError('Cannot cancel order with completed payments. Please process refunds first.');
  }

  // Cancel order and restock inventory
  await prisma.$transaction(async (tx) => {
    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        payment_status: PaymentStatus.CANCELLED,
      },
    });

    // Update payment statuses
    await tx.payment.updateMany({
      where: { order_id: orderId },
      data: { payment_status: PaymentStatus.CANCELLED },
    });

    // Restock inventory
    await updateInventory(
      existingOrder.order_items.map(item => ({
        partId: item.part_id,
        quantity: item.quantity,
        part: item.part,
      })),
      'restore'
    );
  });

  // Get updated order
  const updatedOrder = await getOrderById(orderId, tenantId, userId);

  // Create audit log
  await createAuditLog({
    action: 'ORDER_CANCEL',
    userId,
    tenantId,
    resourceType: 'Order',
    resourceId: orderId,
    changes: {
      previousStatus: existingOrder.status,
      newStatus: OrderStatus.CANCELLED,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Order cancelled', {
    orderId,
    tenantId,
    userId,
  });

  return updatedOrder;
};

/**
 * Get customer orders
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
            part: {
              select: {
                id: true,
                part_number: true,
                name: true,
                condition: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            payment_status: true,
            payment_date: true,
          },
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            order_items: true,
            payments: true,
            shipments: true,
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

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getCustomerOrders,
};