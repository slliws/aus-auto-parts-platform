import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { PaymentMethod, PaymentGateway } from '@prisma/client';

// ============================================================================
// PAYMENT ENDPOINTS
// ============================================================================

/**
 * Create a new payment
 * POST /api/payments
 */
export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, customerId, amount, paymentMethod, paymentGateway, paymentMethodId, referenceNumber, metadata, notes } = req.body;
    const tenantId = req.tenant!.id;

    // Validate required fields
    if (!orderId || !customerId || !amount || !paymentMethod) {
      throw new AppError('Missing required fields', 400);
    }

    // Validate payment method enum
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }

    // Validate payment gateway enum if provided
    if (paymentGateway && !Object.values(PaymentGateway).includes(paymentGateway)) {
      throw new AppError('Invalid payment gateway', 400);
    }

    const payment = await paymentService.createPayment({
      tenantId,
      orderId,
      customerId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentGateway,
      paymentMethodId,
      referenceNumber,
      metadata,
      notes,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a payment
 * POST /api/payments/:id/process
 */
export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const result = await paymentService.processPayment(id, tenantId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund a payment
 * POST /api/payments/:id/refund
 */
export const refundPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const tenantId = req.tenant!.id;

    if (!amount) {
      throw new AppError('Refund amount is required', 400);
    }

    const result = await paymentService.refundPayment(id, tenantId, parseFloat(amount), reason);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a payment by ID
 * GET /api/payments/:id
 */
export const getPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const payment = await paymentService.getPayment(id, tenantId);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payments for an order
 * GET /api/payments/order/:orderId
 */
export const getOrderPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const tenantId = req.tenant!.id;

    const payments = await paymentService.getOrderPayments(orderId, tenantId);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check payment status
 * GET /api/payments/:id/status
 */
export const checkPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const status = await paymentService.checkPaymentStatus(id, tenantId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PAYMENT METHOD ENDPOINTS
// ============================================================================

/**
 * Save a customer payment method
 * POST /api/payments/methods
 */
export const savePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      customerId,
      paymentMethod,
      paymentGateway,
      isDefault,
      cardDetails,
      bankDetails,
      gatewayToken,
      billingName,
      billingEmail,
      billingAddress,
    } = req.body;
    const tenantId = req.tenant!.id;

    // Validate required fields
    if (!customerId || !paymentMethod || !paymentGateway) {
      throw new AppError('Missing required fields', 400);
    }

    // Validate enums
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }

    if (!Object.values(PaymentGateway).includes(paymentGateway)) {
      throw new AppError('Invalid payment gateway', 400);
    }

    const savedMethod = await paymentService.savePaymentMethod({
      tenantId,
      customerId,
      paymentMethod,
      paymentGateway,
      isDefault,
      cardDetails,
      bankDetails,
      gatewayToken,
      billingName,
      billingEmail,
      billingAddress,
    });

    res.status(201).json({
      success: true,
      data: savedMethod,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer payment methods
 * GET /api/payments/methods/customer/:customerId
 */
export const getCustomerPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const tenantId = req.tenant!.id;

    const methods = await paymentService.getCustomerPaymentMethods(customerId, tenantId);

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment method
 * DELETE /api/payments/methods/:id
 */
export const deletePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const result = await paymentService.deletePaymentMethod(id, tenantId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create payment and process immediately
 * POST /api/payments/create-and-process
 */
export const createAndProcessPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, customerId, amount, paymentMethod, paymentGateway, paymentMethodId, referenceNumber, metadata, notes } = req.body;
    const tenantId = req.tenant!.id;

    // Validate required fields
    if (!orderId || !customerId || !amount || !paymentMethod) {
      throw new AppError('Missing required fields', 400);
    }

    // Validate payment method enum
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }

    // Validate payment gateway enum if provided
    if (paymentGateway && !Object.values(PaymentGateway).includes(paymentGateway)) {
      throw new AppError('Invalid payment gateway', 400);
    }

    // Create payment
    const payment = await paymentService.createPayment({
      tenantId,
      orderId,
      customerId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentGateway,
      paymentMethodId,
      referenceNumber,
      metadata,
      notes,
    });

    // Process payment immediately
    const result = await paymentService.processPayment(payment.id, tenantId);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};