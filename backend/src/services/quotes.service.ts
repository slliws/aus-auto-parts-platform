/**
 * Quotes service
 * Handles business logic for quote management operations
 * Implements CRUD operations with multi-tenant isolation
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../utils/errors';
import { Quote, QuoteItem, Prisma } from '@prisma/client';
import * as ordersService from '../services/orders.service';

/**
 * Interface for creating a new quote
 */
export interface CreateQuoteDTO {
  tenantId: string;
  customerId: string;
  userId: string;
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  expiresAt?: Date;
  notes?: string;
  terms?: string;
  quoteItems: CreateQuoteItemDTO[];
}

/**
 * Interface for creating a quote item
 */
export interface CreateQuoteItemDTO {
  partId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Interface for updating a quote
 */
export interface UpdateQuoteDTO {
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  expiresAt?: Date;
  notes?: string;
  terms?: string;
  quoteItems?: UpdateQuoteItemDTO[];
}

/**
 * Interface for updating a quote item
 */
export interface UpdateQuoteItemDTO {
  id?: string; // For existing items
  partId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Interface for quote search/filter parameters
 */
export interface QuoteFilters {
  search?: string;
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  customerId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isExpired?: boolean;
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
export interface PaginatedQuotesResponse {
  data: QuoteWithDetails[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Quote with details
 */
export interface QuoteWithDetails extends Omit<Quote, 'subtotal_amount' | 'gst_amount' | 'total_amount'> {
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  quote_items: (QuoteItem & {
    part: {
      name: string;
      part_number: string;
    };
  })[];
  _count?: {
    quote_items: number;
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
 * GST rate (10% for Australia)
 */
const GST_RATE = 0.10;

/**
 * Generate unique quote number per tenant
 */
const generateQuoteNumber = async (tenantId: string): Promise<string> => {
  // Get current year
  const currentYear = new Date().getFullYear();

  // Count quotes for this tenant this year
  const quoteCount = await prisma.quote.count({
    where: {
      tenant_id: tenantId,
      created_at: {
        gte: new Date(currentYear, 0, 1), // Start of current year
        lt: new Date(currentYear + 1, 0, 1), // Start of next year
      },
    },
  });

  // Format: Q{year}{4-digit sequential number}
  const sequentialNumber = (quoteCount + 1).toString().padStart(4, '0');
  return `Q${currentYear}${sequentialNumber}`;
};

/**
 * Calculate GST for an amount
 */
const calculateGST = (amount: number): number => {
  return Math.round(amount * GST_RATE * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate quote totals
 */
const calculateQuoteTotals = (items: { quantity: number; unitPrice: number }[]): {
  subtotal: number;
  gst: number;
  total: number;
} => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

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
 * Validate quote status transitions
 */
const validateStatusTransition = (
  currentStatus: string,
  newStatus: string
): void => {
  const validTransitions: Record<string, string[]> = {
    DRAFT: ['SENT'],
    SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
    ACCEPTED: ['CONVERTED'],
    REJECTED: [],
    EXPIRED: [],
    CONVERTED: [],
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new ValidationError(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
  }
};

/**
 * Get all quotes with pagination and filtering
 */
export const getQuotes = async (
  tenantId: string,
  filters: QuoteFilters = {},
  pagination: PaginationParams = {},
  userId?: string
): Promise<PaginatedQuotesResponse> => {
  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause with tenant isolation
  const where: Prisma.QuoteWhereInput = {
    tenant_id: tenantId,
  };

  // Apply filters
  if (filters.search) {
    where.OR = [
      { quote_number: { contains: filters.search, mode: 'insensitive' } },
      { customer: { first_name: { contains: filters.search, mode: 'insensitive' } } },
      { customer: { last_name: { contains: filters.search, mode: 'insensitive' } } },
      { customer: { email: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters.status) {
    where.status = filters.status as any;
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

  if (filters.isExpired !== undefined) {
    const now = new Date();
    if (filters.isExpired) {
      where.expires_at = { lt: now };
      where.status = { in: ['DRAFT', 'SENT'] };
    } else {
      where.OR = [
        { expires_at: { gte: now } },
        { expires_at: null },
        { status: { notIn: ['DRAFT', 'SENT'] } },
      ];
    }
  }

  // Execute query with pagination
  const [quotes, totalItems] = await Promise.all([
    prisma.quote.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        quote_items: {
          include: {
            part: {
              select: {
                name: true,
                part_number: true,
              },
            },
          },
        },
        _count: {
          select: {
            quote_items: true,
          },
        },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  logger.info('Quotes retrieved', {
    tenantId,
    count: quotes.length,
    totalItems,
    page,
    userId,
  });

  return {
    data: quotes as unknown as QuoteWithDetails[],
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/**
 * Get quote by ID
 */
export const getQuoteById = async (
  quoteId: string,
  tenantId: string,
  userId?: string
): Promise<QuoteWithDetails> => {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
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
          company_name: true,
        },
      },
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      quote_items: {
        include: {
          part: {
            select: {
              id: true,
              name: true,
              part_number: true,
              description: true,
              condition: true,
            },
          },
        },
      },
      _count: {
        select: {
          quote_items: true,
        },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  logger.info('Quote retrieved', { quoteId, tenantId, userId });

  return quote as unknown as QuoteWithDetails;
};

/**
 * Create new quote
 */
export const createQuote = async (
  data: CreateQuoteDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<QuoteWithDetails> => {
  // Validate customer belongs to tenant
  const customer = await prisma.customer.findFirst({
    where: {
      id: data.customerId,
      tenant_id: data.tenantId,
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  // Generate quote number
  const quoteNumber = await generateQuoteNumber(data.tenantId);

  // Set default expiry (7 days from now)
  const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Calculate totals
  const totals = calculateQuoteTotals(data.quoteItems);

  // Create quote with items in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create quote
    const quote = await tx.quote.create({
      data: {
        tenant_id: data.tenantId,
        customer_id: data.customerId,
        user_id: data.userId,
        quote_number: quoteNumber,
        status: (data.status || 'DRAFT') as any,
        subtotal_amount: totals.subtotal,
        gst_amount: totals.gst,
        total_amount: totals.total,
        notes: data.notes || null,
        terms: data.terms || null,
        expires_at: expiresAt,
      },
    });

    // Create quote items
    const quoteItems = await Promise.all(
      data.quoteItems.map((item) =>
        tx.quoteItem.create({
          data: {
            quote_id: quote.id,
            part_id: item.partId,
            quantity: item.quantity,
            unit_price: new Prisma.Decimal(item.unitPrice),
            gst_amount: new Prisma.Decimal(calculateGST(item.quantity * item.unitPrice)),
            total_price: new Prisma.Decimal(Math.round((item.quantity * item.unitPrice) * 1.1 * 100) / 100),
            notes: item.notes || null,
          },
        })
      )
    );

    return { quote, quoteItems };
  });

  // Create audit log
  await createAuditLog({
    action: 'QUOTE_CREATE',
    userId,
    tenantId: data.tenantId,
    resourceType: 'Quote',
    resourceId: result.quote.id,
    changes: {
      quoteNumber: result.quote.quote_number,
      customerId: data.customerId,
      totalAmount: result.quote.total_amount,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Quote created', {
    quoteId: result.quote.id,
    quoteNumber,
    customerId: data.customerId,
    tenantId: data.tenantId,
    userId,
  });

  // Return quote with details
  return await getQuoteById(result.quote.id, data.tenantId, userId);
};

/**
 * Update quote
 */
export const updateQuote = async (
  quoteId: string,
  tenantId: string,
  data: UpdateQuoteDTO,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<QuoteWithDetails> => {
  // Check if quote exists and belongs to tenant
  const existingQuote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenant_id: tenantId,
    },
    include: {
      quote_items: true,
    },
  });

  if (!existingQuote) {
    throw new NotFoundError('Quote not found');
  }

  // Validate status transition if status is being updated
  if (data.status && data.status !== existingQuote.status) {
    validateStatusTransition(existingQuote.status, data.status);
  }

  // Don't allow updates to converted quotes
  if (existingQuote.status === 'CONVERTED') {
    throw new ValidationError('Cannot update a converted quote');
  }

  // Prepare update data
  const updateData: Prisma.QuoteUpdateInput = {};
  if (data.status) updateData.status = data.status as any;
  if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.terms !== undefined) updateData.terms = data.terms;

  // Handle quote items update if provided
  if (data.quoteItems) {
    // Recalculate totals
    const totals = calculateQuoteTotals(data.quoteItems);

    updateData.subtotal_amount = totals.subtotal;
    updateData.gst_amount = totals.gst;
    updateData.total_amount = totals.total;
  }

  // Update quote and items in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update quote
    const updatedQuote = await tx.quote.update({
      where: { id: quoteId },
      data: updateData,
    });

    // Update quote items if provided
    if (data.quoteItems) {
      // Delete existing items
      await tx.quoteItem.deleteMany({
        where: { quote_id: quoteId },
      });

      // Create new items
      await Promise.all(
        data.quoteItems.map((item) =>
          tx.quoteItem.create({
            data: {
              quote_id: quoteId,
              part_id: item.partId,
              quantity: item.quantity,
              unit_price: new Prisma.Decimal(item.unitPrice),
              gst_amount: new Prisma.Decimal(calculateGST(item.quantity * item.unitPrice)),
              total_price: new Prisma.Decimal(Math.round((item.quantity * item.unitPrice) * 1.1 * 100) / 100),
              notes: item.notes || null,
            },
          })
        )
      );
    }

    return updatedQuote;
  });

  // Create audit log
  await createAuditLog({
    action: 'QUOTE_UPDATE',
    userId,
    tenantId,
    resourceType: 'Quote',
    resourceId: quoteId,
    changes: data as Record<string, unknown>,
    ipAddress,
    userAgent,
  });

  logger.info('Quote updated', {
    quoteId,
    tenantId,
    userId,
  });

  return await getQuoteById(quoteId, tenantId, userId);
};

/**
 * Send quote (change status from DRAFT to SENT)
 */
export const sendQuote = async (
  quoteId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<QuoteWithDetails> => {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenant_id: tenantId,
    },
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  if (quote.status !== 'DRAFT') {
    throw new ValidationError('Only draft quotes can be sent');
  }

  const updatedQuote = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'SENT',
      sent_at: new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'QUOTE_SEND',
    userId,
    tenantId,
    resourceType: 'Quote',
    resourceId: quoteId,
    changes: {
      status: 'SENT',
      sentAt: new Date(),
    },
    ipAddress,
    userAgent,
  });

  logger.info('Quote sent', { quoteId, tenantId, userId });

  return await getQuoteById(quoteId, tenantId, userId);
};

/**
 * Delete quote (soft delete by setting status to appropriate state)
 */
export const deleteQuote = async (
  quoteId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  // Check if quote exists and belongs to tenant
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenant_id: tenantId,
    },
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Don't allow deletion of converted quotes
  if (quote.status === 'CONVERTED') {
    throw new ValidationError('Cannot delete a converted quote');
  }

  // Check if quote has active orders
  const activeOrdersCount = await prisma.order.count({
    where: {
      quote_id: quoteId,
      status: {
        in: ['PENDING', 'PICKING', 'PACKED', 'SHIPPED'],
      },
    },
  });

  if (activeOrdersCount > 0) {
    throw new ValidationError('Cannot delete quote with active orders');
  }

  // Mark as deleted (you could add a deleted_at field if needed)
  // For now, we'll set status to REJECTED if it was SENT, or just leave it as is
  const updateData: Prisma.QuoteUpdateInput = {};
  if (quote.status === 'SENT') {
    updateData.status = 'REJECTED';
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: updateData,
  });

  // Create audit log
  await createAuditLog({
    action: 'QUOTE_DELETE',
    userId,
    tenantId,
    resourceType: 'Quote',
    resourceId: quoteId,
    changes: {
      previousStatus: quote.status,
    },
    ipAddress,
    userAgent,
  });

  logger.info('Quote deleted (soft delete)', {
    quoteId,
    tenantId,
    userId,
  });
};

/**
 * Get quote statistics
 */
export const getQuoteStats = async (
  tenantId: string,
  userId?: string
) => {
  const [
    totalQuotes,
    draftQuotes,
    sentQuotes,
    acceptedQuotes,
    rejectedQuotes,
    expiredQuotes,
    convertedQuotes,
    quotesThisMonth,
    averageQuoteValue,
  ] = await Promise.all([
    prisma.quote.count({ where: { tenant_id: tenantId } }),
    prisma.quote.count({ where: { tenant_id: tenantId, status: 'DRAFT' } }),
    prisma.quote.count({ where: { tenant_id: tenantId, status: 'SENT' } }),
    prisma.quote.count({ where: { tenant_id: tenantId, status: 'ACCEPTED' } }),
    prisma.quote.count({ where: { tenant_id: tenantId, status: 'REJECTED' } }),
    prisma.quote.count({ where: { tenant_id: tenantId, status: 'EXPIRED' } }),
    prisma.quote.count({ where: { tenant_id: tenantId, status: 'CONVERTED' } }),
    prisma.quote.count({
      where: {
        tenant_id: tenantId,
        created_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.quote.aggregate({
      where: { tenant_id: tenantId },
      _avg: {
        total_amount: true,
      },
    }),
  ]);

  logger.info('Quote statistics retrieved', { tenantId, userId });

  return {
    totalQuotes,
    draftQuotes,
    sentQuotes,
    acceptedQuotes,
    rejectedQuotes,
    expiredQuotes,
    convertedQuotes,
    quotesThisMonth,
    averageQuoteValue: averageQuoteValue._avg.total_amount?.toNumber() || 0,
  };
};

/**
 * Convert accepted quote to order
 */
export const convertQuote = async (
  quoteId: string,
  tenantId: string,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<QuoteWithDetails> => {
  // Check if quote exists and belongs to tenant
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      tenant_id: tenantId,
    },
    include: {
      quote_items: {
        include: {
          part: true,
        },
      },
      customer: true,
      user: true,
    },
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Validate quote status
  if (quote.status !== 'ACCEPTED') {
    throw new ValidationError('Only accepted quotes can be converted to orders');
  }

  // Check if quote is expired
  if (quote.expires_at && new Date() > quote.expires_at) {
    throw new ValidationError('Cannot convert expired quote to order');
  }

  // Validate inventory for all quote items
  for (const item of quote.quote_items) {
    if (item.part.stock_quantity < item.quantity) {
      throw new ValidationError(
        `Insufficient stock for part ${item.part.part_number}. Available: ${item.part.stock_quantity}, Required: ${item.quantity}`
      );
    }
  }

  // Prepare order items from quote items
  const orderItems = quote.quote_items.map(item => ({
    partId: item.part_id,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
  }));

  // Orders service already imported at top of file

  // Create order using existing logic
  const orderData: ordersService.CreateOrderDTO = {
    tenantId,
    customerId: quote.customer_id,
    userId: quote.user_id, // Use original quote creator
    quoteId: quote.id,
    orderItems,
  };

  // Create the order (this will handle inventory reduction and validation)
  await ordersService.createOrder(
    orderData,
    userId || quote.user_id,
    ipAddress,
    userAgent
  );

  // Update quote status to CONVERTED
  const updatedQuote = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: 'CONVERTED',
      updated_at: new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'QUOTE_CONVERT',
    userId,
    tenantId,
    resourceType: 'Quote',
    resourceId: quoteId,
    changes: {
      status: 'CONVERTED',
    },
    ipAddress,
    userAgent,
  });

  logger.info('Quote converted to order', {
    quoteId,
    tenantId,
    userId,
  });

  return await getQuoteById(quoteId, tenantId, userId);
};

/**
 * Handle quote expiry (called by background job)
 */
export const expireQuotes = async (): Promise<number> => {
  const now = new Date();

  const result = await prisma.quote.updateMany({
    where: {
      status: { in: ['DRAFT', 'SENT'] },
      expires_at: { lt: now },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  logger.info('Quotes expired', { count: result.count });

  return result.count;
};

export default {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  sendQuote,
  deleteQuote,
  getQuoteStats,
  expireQuotes,
  convertQuote,
};