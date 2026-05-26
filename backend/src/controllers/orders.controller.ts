import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as ordersService from '../services/orders.service';
import { logger } from '../utils/logger';
import * as emailService from '../services/email.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import PDFService from '../services/pdf.service';

/**
 * Orders controller
 * Handles HTTP requests for order management
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
 * Get all orders with pagination and filtering
 * @route GET /api/v1/orders
 */
export const getOrders = asyncHandler(
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
    const filters: ordersService.OrderFilters = {};
    if (req.query.status) filters.status = req.query.status as OrderStatus;
    if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus as PaymentStatus;
    if (req.query.customerId) filters.customerId = req.query.customerId as string;
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount as string);
    if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount as string);
    if (req.query.search) filters.search = req.query.search as string;

    const result = await ordersService.getOrders(
      tenantId,
      filters,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);

/**
 * Get single order by ID
 * @route GET /api/v1/orders/:id
 */
export const getOrderById = asyncHandler(
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

    const order = await ordersService.getOrderById(id, tenantId, userId);

    const response: ApiResponse = {
      success: true,
      data: { order },
    };

    res.status(200).json(response);
  }
);

/**
 * Create new order
 * @route POST /api/v1/orders
 */
export const createOrder = asyncHandler(
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

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: 'User authentication required',
      };
      res.status(401).json(response);
      return;
    }

    const orderData: ordersService.CreateOrderDTO = {
      tenantId,
      customerId: req.body.customerId,
      userId,
      quoteId: req.body.quoteId,
      orderItems: req.body.orderItems,
      notes: req.body.notes,
      internalNotes: req.body.internalNotes,
    };

    const order = await ordersService.createOrder(
      orderData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    // Send order confirmation email (async, non-blocking — failure never breaks the response)
    if (order.customer?.email) {
      const customerName = [order.customer.first_name, order.customer.last_name]
        .filter(Boolean).join(' ') || order.customer.email;
      emailService.sendOrderConfirmationEmail(
        order.customer.email,
        order.order_number,
        customerName,
        order.total_amount,
        'AUD'
      ).catch(err =>
        logger.warn('[orders] Order confirmation email failed', {
          orderId: order.id,
          error: err.message,
        })
      );
    }

    const response: ApiResponse = {
      success: true,
      message: 'Order created successfully',
      data: { order },
    };

    res.status(201).json(response);
  }
);

/**
 * Update existing order
 * @route PATCH /api/v1/orders/:id
 */
export const updateOrder = asyncHandler(
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

    const updateData: ordersService.UpdateOrderDTO = {};
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.internalNotes !== undefined) updateData.internalNotes = req.body.internalNotes;
    if (req.body.status) updateData.status = req.body.status;

    const order = await ordersService.updateOrder(
      id,
      tenantId,
      updateData,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Order updated successfully',
      data: { order },
    };

    res.status(200).json(response);
  }
);

/**
 * Cancel order
 * @route POST /api/v1/orders/:id/cancel
 */
export const cancelOrder = asyncHandler(
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

    const order = await ordersService.cancelOrder(
      id,
      tenantId,
      userId,
      getIpAddress(req),
      getUserAgent(req)
    );

    const response: ApiResponse = {
      success: true,
      message: 'Order cancelled successfully',
      data: { order },
    };

    res.status(200).json(response);
  }
);

/**
 * Get customer's order history
 * @route GET /api/v1/orders/customer/:customerId
 */
export const getCustomerOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { customerId } = req.params;
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

    const result = await ordersService.getCustomerOrders(
      customerId,
      tenantId,
      { page, limit },
      userId
    );

    const response: ApiResponse = {
      success: true,
      data: result.data,
      meta: result.meta,
    };

    res.status(200).json(response);
  }
);


/**
 * Download order invoice as PDF
 * @route GET /api/v1/orders/:id/invoice
 */
export const downloadOrderInvoice = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = { success: false, message: 'Tenant context not found' };
      res.status(400).json(response);
      return;
    }

    const order = await ordersService.getOrderById(id, tenantId, userId);
    const pdfBuffer = await PDFService.generateInvoicePDF(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.order_number}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  }
);

export default {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getCustomerOrders,
  downloadOrderInvoice,
};