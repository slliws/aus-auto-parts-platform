import { PrismaClient, PaymentStatus, PaymentGateway, PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';
import { AppError } from '../utils/errors';
import prisma from '../models/prisma';
import logger from '../utils/logger';

// ============================================================================
// INTERFACES
// ============================================================================

export interface PaymentGatewayInterface {
  processPayment(params: ProcessPaymentParams): Promise<PaymentGatewayResponse>;
  refundPayment(params: RefundPaymentParams): Promise<PaymentGatewayResponse>;
  capturePayment(params: CapturePaymentParams): Promise<PaymentGatewayResponse>;
  authorizePayment(params: AuthorizePaymentParams): Promise<PaymentGatewayResponse>;
  getPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResponse>;
  validatePaymentMethod(params: ValidatePaymentMethodParams): Promise<boolean>;
}

export interface ProcessPaymentParams {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  paymentMethod: PaymentMethod;
  customerId: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RefundPaymentParams {
  gatewayPaymentId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface CapturePaymentParams {
  authorizationId: string;
  amount?: number;
  metadata?: Record<string, any>;
}

export interface AuthorizePaymentParams {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  paymentMethod: PaymentMethod;
  customerId: string;
  orderId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ValidatePaymentMethodParams {
  paymentMethod: PaymentMethod;
  paymentMethodId?: string;
  cardDetails?: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  };
  bankDetails?: {
    bsb: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface PaymentGatewayResponse {
  success: boolean;
  gatewayPaymentId?: string;
  gatewayTransactionId?: string;
  status: PaymentStatus;
  transactionStatus: TransactionStatus;
  amount: number;
  authorizationCode?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  transactionStatus: TransactionStatus;
  amount: number;
  capturedAmount?: number;
  refundedAmount?: number;
  metadata?: Record<string, any>;
}

export interface CreatePaymentParams {
  tenantId: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentGateway?: PaymentGateway;
  paymentMethodId?: string;
  referenceNumber?: string;
  metadata?: Record<string, any>;
  notes?: string;
}

export interface SavePaymentMethodParams {
  tenantId: string;
  customerId: string;
  paymentMethod: PaymentMethod;
  paymentGateway: PaymentGateway;
  isDefault?: boolean;
  cardDetails?: {
    lastFour: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  bankDetails?: {
    bankName: string;
    accountName: string;
    bsb: string;
    accountNumberLastFour: string;
  };
  gatewayToken?: string;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: string;
}

// ============================================================================
// MOCK PAYMENT GATEWAY
// ============================================================================

class MockPaymentGateway implements PaymentGatewayInterface {
  async processPayment(params: ProcessPaymentParams): Promise<PaymentGatewayResponse> {
    logger.info('MockGateway: Processing payment', { amount: params.amount, orderId: params.orderId });

    // Simulate processing delay
    await this.simulateDelay(500);

    // Simulate random success/failure (90% success rate for testing)
    const success = Math.random() > 0.1;

    if (!success) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        transactionStatus: TransactionStatus.FAILED,
        amount: params.amount,
        errorCode: 'MOCK_PAYMENT_DECLINED',
        errorMessage: 'Payment was declined by the mock gateway',
      };
    }

    const gatewayPaymentId = `mock_pay_${this.generateId()}`;
    const gatewayTransactionId = `mock_txn_${this.generateId()}`;

    return {
      success: true,
      gatewayPaymentId,
      gatewayTransactionId,
      status: PaymentStatus.COMPLETED,
      transactionStatus: TransactionStatus.COMPLETED,
      amount: params.amount,
      authorizationCode: this.generateAuthCode(),
      metadata: {
        processedAt: new Date().toISOString(),
        gateway: 'mock',
      },
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentGatewayResponse> {
    logger.info('MockGateway: Processing refund', { gatewayPaymentId: params.gatewayPaymentId, amount: params.amount });

    await this.simulateDelay(500);

    const gatewayTransactionId = `mock_refund_${this.generateId()}`;

    return {
      success: true,
      gatewayPaymentId: params.gatewayPaymentId,
      gatewayTransactionId,
      status: PaymentStatus.REFUNDED,
      transactionStatus: TransactionStatus.COMPLETED,
      amount: params.amount,
      metadata: {
        refundedAt: new Date().toISOString(),
        reason: params.reason,
      },
    };
  }

  async capturePayment(params: CapturePaymentParams): Promise<PaymentGatewayResponse> {
    logger.info('MockGateway: Capturing payment', { authorizationId: params.authorizationId });

    await this.simulateDelay(500);

    const gatewayTransactionId = `mock_capture_${this.generateId()}`;

    return {
      success: true,
      gatewayPaymentId: params.authorizationId,
      gatewayTransactionId,
      status: PaymentStatus.COMPLETED,
      transactionStatus: TransactionStatus.COMPLETED,
      amount: params.amount || 0,
      metadata: {
        capturedAt: new Date().toISOString(),
      },
    };
  }

  async authorizePayment(params: AuthorizePaymentParams): Promise<PaymentGatewayResponse> {
    logger.info('MockGateway: Authorizing payment', { amount: params.amount, orderId: params.orderId });

    await this.simulateDelay(500);

    const gatewayPaymentId = `mock_auth_${this.generateId()}`;
    const gatewayTransactionId = `mock_txn_${this.generateId()}`;

    return {
      success: true,
      gatewayPaymentId,
      gatewayTransactionId,
      status: PaymentStatus.PENDING,
      transactionStatus: TransactionStatus.COMPLETED,
      amount: params.amount,
      authorizationCode: this.generateAuthCode(),
      metadata: {
        authorizedAt: new Date().toISOString(),
      },
    };
  }

  async getPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResponse> {
    logger.info('MockGateway: Getting payment status', { gatewayPaymentId });

    await this.simulateDelay(300);

    return {
      status: PaymentStatus.COMPLETED,
      transactionStatus: TransactionStatus.COMPLETED,
      amount: 100.00,
      capturedAmount: 100.00,
      refundedAmount: 0,
    };
  }

  async validatePaymentMethod(params: ValidatePaymentMethodParams): Promise<boolean> {
    logger.info('MockGateway: Validating payment method', { paymentMethod: params.paymentMethod });

    await this.simulateDelay(300);

    // Mock validation - always returns true for development
    return true;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateAuthCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// PAYMENT SERVICE
// ============================================================================

export class PaymentService {
  private gateway: PaymentGatewayInterface;

  constructor(gateway?: PaymentGatewayInterface) {
    this.gateway = gateway || new MockPaymentGateway();
  }

  /**
   * Create a new payment record
   */
  async createPayment(params: CreatePaymentParams) {
    try {
      const payment = await prisma.payment.create({
        data: {
          tenant_id: params.tenantId,
          order_id: params.orderId,
          customer_id: params.customerId,
          payment_method_id: params.paymentMethodId,
          payment_method: params.paymentMethod,
          payment_gateway: params.paymentGateway || PaymentGateway.MOCK,
          payment_status: PaymentStatus.PENDING,
          amount: params.amount,
          currency: 'AUD',
          reference_number: params.referenceNumber,
          metadata: params.metadata,
          notes: params.notes,
        },
        include: {
          order: true,
          customer: true,
          saved_payment_method: true,
        },
      });

      logger.info('Payment created', { paymentId: payment.id, amount: payment.amount });
      return payment;
    } catch (error) {
      logger.error('Error creating payment', { error, params });
      throw new AppError('Failed to create payment', 500);
    }
  }

  /**
   * Process a payment through the gateway
   */
  async processPayment(paymentId: string, tenantId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, tenant_id: tenantId },
        include: { order: true, customer: true },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.payment_status !== PaymentStatus.PENDING) {
        throw new AppError('Payment cannot be processed in current status', 400);
      }

      // Update payment status to processing
      await prisma.payment.update({
        where: { id: paymentId },
        data: { payment_status: PaymentStatus.PROCESSING },
      });

      // Process through gateway
      const gatewayResponse = await this.gateway.processPayment({
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentMethodId: payment.payment_method_id || undefined,
        paymentMethod: payment.payment_method,
        customerId: payment.customer_id,
        orderId: payment.order_id,
        description: `Payment for order ${payment.order.order_number}`,
        metadata: payment.metadata as Record<string, any>,
      });

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          tenant_id: tenantId,
          payment_id: paymentId,
          transaction_type: TransactionType.PAYMENT,
          transaction_status: gatewayResponse.transactionStatus,
          amount: gatewayResponse.amount,
          currency: payment.currency,
          gateway_transaction_id: gatewayResponse.gatewayTransactionId,
          authorization_code: gatewayResponse.authorizationCode,
          error_code: gatewayResponse.errorCode,
          error_message: gatewayResponse.errorMessage,
          gateway_response: gatewayResponse.metadata,
          processed_at: gatewayResponse.success ? new Date() : null,
        },
      });

      // Update payment with gateway response
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          payment_status: gatewayResponse.status,
          gateway_payment_id: gatewayResponse.gatewayPaymentId,
          payment_date: gatewayResponse.success ? new Date() : null,
        },
        include: {
          order: true,
          customer: true,
          transactions: true,
        },
      });

      // Update order payment status if payment completed
      if (gatewayResponse.success && gatewayResponse.status === PaymentStatus.COMPLETED) {
        await prisma.order.update({
          where: { id: payment.order_id },
          data: { payment_status: PaymentStatus.COMPLETED },
        });
      }

      logger.info('Payment processed', {
        paymentId,
        success: gatewayResponse.success,
        status: gatewayResponse.status,
      });

      return { payment: updatedPayment, transaction, gatewayResponse };
    } catch (error) {
      logger.error('Error processing payment', { error, paymentId });
      
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { payment_status: PaymentStatus.FAILED },
      }).catch(() => {});

      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process payment', 500);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, tenantId: string, amount: number, reason?: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, tenant_id: tenantId },
        include: { transactions: true },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.payment_status !== PaymentStatus.COMPLETED) {
        throw new AppError('Only completed payments can be refunded', 400);
      }

      if (!payment.gateway_payment_id) {
        throw new AppError('Payment has no gateway payment ID', 400);
      }

      // Check if refund amount is valid
      const totalRefunded = payment.transactions
        .filter(t => t.transaction_type === TransactionType.REFUND && t.transaction_status === TransactionStatus.COMPLETED)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      if (totalRefunded + amount > Number(payment.amount)) {
        throw new AppError('Refund amount exceeds available refund amount', 400);
      }

      // Process refund through gateway
      const gatewayResponse = await this.gateway.refundPayment({
        gatewayPaymentId: payment.gateway_payment_id,
        amount,
        reason,
      });

      // Find original payment transaction
      const originalTransaction = payment.transactions.find(
        t => t.transaction_type === TransactionType.PAYMENT && t.transaction_status === TransactionStatus.COMPLETED
      );

      // Create refund transaction
      const transaction = await prisma.transaction.create({
        data: {
          tenant_id: tenantId,
          payment_id: paymentId,
          transaction_type: TransactionType.REFUND,
          transaction_status: gatewayResponse.transactionStatus,
          amount,
          currency: payment.currency,
          gateway_transaction_id: gatewayResponse.gatewayTransactionId,
          refund_reason: reason,
          original_transaction_id: originalTransaction?.id,
          error_code: gatewayResponse.errorCode,
          error_message: gatewayResponse.errorMessage,
          gateway_response: gatewayResponse.metadata,
          processed_at: gatewayResponse.success ? new Date() : null,
        },
      });

      // Update payment status
      const newTotalRefunded = totalRefunded + amount;
      const newStatus = newTotalRefunded >= Number(payment.amount) 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIALLY_REFUNDED;

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { payment_status: newStatus },
        include: {
          order: true,
          customer: true,
          transactions: true,
        },
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: payment.order_id },
        data: { payment_status: newStatus },
      });

      logger.info('Payment refunded', {
        paymentId,
        amount,
        newStatus,
      });

      return { payment: updatedPayment, transaction, gatewayResponse };
    } catch (error) {
      logger.error('Error refunding payment', { error, paymentId });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refund payment', 500);
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string, tenantId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, tenant_id: tenantId },
        include: {
          order: true,
          customer: true,
          saved_payment_method: true,
          transactions: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      return payment;
    } catch (error) {
      logger.error('Error getting payment', { error, paymentId });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get payment', 500);
    }
  }

  /**
   * Get payments for an order
   */
  async getOrderPayments(orderId: string, tenantId: string) {
    try {
      const payments = await prisma.payment.findMany({
        where: { order_id: orderId, tenant_id: tenantId },
        include: {
          customer: true,
          transactions: {
            orderBy: { created_at: 'desc' },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return payments;
    } catch (error) {
      logger.error('Error getting order payments', { error, orderId });
      throw new AppError('Failed to get order payments', 500);
    }
  }

  /**
   * Save a customer payment method
   */
  async savePaymentMethod(params: SavePaymentMethodParams) {
    try {
      // If setting as default, unset other default methods
      if (params.isDefault) {
        await prisma.customerPaymentMethod.updateMany({
          where: {
            tenant_id: params.tenantId,
            customer_id: params.customerId,
            is_default: true,
          },
          data: { is_default: false },
        });
      }

      const paymentMethod = await prisma.customerPaymentMethod.create({
        data: {
          tenant_id: params.tenantId,
          customer_id: params.customerId,
          payment_method: params.paymentMethod,
          payment_gateway: params.paymentGateway,
          is_default: params.isDefault || false,
          card_last_four: params.cardDetails?.lastFour,
          card_brand: params.cardDetails?.brand,
          card_expiry_month: params.cardDetails?.expiryMonth,
          card_expiry_year: params.cardDetails?.expiryYear,
          bank_name: params.bankDetails?.bankName,
          account_name: params.bankDetails?.accountName,
          bsb: params.bankDetails?.bsb,
          account_number_last_four: params.bankDetails?.accountNumberLastFour,
          gateway_token: params.gatewayToken,
          billing_name: params.billingName,
          billing_email: params.billingEmail,
          billing_address: params.billingAddress,
        },
      });

      logger.info('Payment method saved', { paymentMethodId: paymentMethod.id });
      return paymentMethod;
    } catch (error) {
      logger.error('Error saving payment method', { error, params });
      throw new AppError('Failed to save payment method', 500);
    }
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(customerId: string, tenantId: string) {
    try {
      const paymentMethods = await prisma.customerPaymentMethod.findMany({
        where: {
          customer_id: customerId,
          tenant_id: tenantId,
          is_active: true,
        },
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' },
        ],
      });

      return paymentMethods;
    } catch (error) {
      logger.error('Error getting customer payment methods', { error, customerId });
      throw new AppError('Failed to get customer payment methods', 500);
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(paymentMethodId: string, tenantId: string) {
    try {
      const paymentMethod = await prisma.customerPaymentMethod.findFirst({
        where: { id: paymentMethodId, tenant_id: tenantId },
      });

      if (!paymentMethod) {
        throw new AppError('Payment method not found', 404);
      }

      await prisma.customerPaymentMethod.update({
        where: { id: paymentMethodId },
        data: { is_active: false },
      });

      logger.info('Payment method deleted', { paymentMethodId });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting payment method', { error, paymentMethodId });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete payment method', 500);
    }
  }

  /**
   * Check payment status from gateway
   */
  async checkPaymentStatus(paymentId: string, tenantId: string) {
    try {
      const payment = await prisma.payment.findFirst({
        where: { id: paymentId, tenant_id: tenantId },
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (!payment.gateway_payment_id) {
        throw new AppError('Payment has no gateway payment ID', 400);
      }

      const status = await this.gateway.getPaymentStatus(payment.gateway_payment_id);

      // Update payment if status changed
      if (status.status !== payment.payment_status) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { payment_status: status.status },
        });
      }

      return status;
    } catch (error) {
      logger.error('Error checking payment status', { error, paymentId });
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to check payment status', 500);
    }
  }
}

export default new PaymentService();