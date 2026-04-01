import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import prisma from '../../models/prisma';
import { PaymentMethod, PaymentGateway, PaymentStatus, CustomerType, OrderStatus } from '@prisma/client';
import { getAdminUserWithToken } from '../helpers';

describe('Payment API Integration Tests', () => {
  let accessToken: string;
  let tenant: any;
  let user: any;
  let customer: any;
  let order: any;

  beforeAll(async () => {
    // Get admin user with real database-generated UUIDs
    const setup = await getAdminUserWithToken();
    accessToken = setup.accessToken;
    tenant = setup.tenant;
    user = setup.user;
    
    // Create test customer using real database records
    customer = await prisma.customer.create({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        customer_type: CustomerType.RETAIL,
        tenant_id: tenant.id,
        address: '123 Customer Street',
        suburb: 'Testville',
        state: 'NSW',
        postcode: '2000',
        is_active: true,
      }
    });
    
    // Create test order using real database records
    order = await prisma.order.create({
      data: {
        order_number: `TEST-${Date.now()}`,
        customer_id: customer.id,
        tenant_id: tenant.id,
        user_id: user.id,
        status: OrderStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        subtotal_amount: 100.00,
        gst_amount: 10.00,
        total_amount: 110.00,
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany({ where: { tenant_id: tenant.id } });
    await prisma.payment.deleteMany({ where: { tenant_id: tenant.id } });
    await prisma.customerPaymentMethod.deleteMany({ where: { tenant_id: tenant.id } });
    await prisma.order.deleteMany({ where: { tenant_id: tenant.id } });
    await prisma.customer.deleteMany({ where: { tenant_id: tenant.id } });
    await prisma.user.deleteMany({ where: { tenant_id: tenant.id } });
    await prisma.tenant.deleteMany({ where: { id: tenant.id } });
  });

  describe('POST /api/v1/payments', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        orderId: order.id,
        customerId: customer.id,
        amount: 110.00,
        paymentMethod: PaymentMethod.CARD,
        paymentGateway: PaymentGateway.MOCK,
        referenceNumber: 'PAY-001',
        notes: 'Test payment',
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.payment_status).toBe(PaymentStatus.PENDING);
      expect(response.body.data.amount).toBe(110.00);
    });

    it('should return 400 for invalid payment method', async () => {
      const invalidData = {
        orderId: order.id,
        customerId: customer.id,
        amount: 100.00,
        paymentMethod: 'INVALID_METHOD',
      };

      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/payments/:id/process', () => {
    let paymentId: string;

    beforeEach(async () => {
      // Create a payment for testing
      const payment = await prisma.payment.create({
        data: {
          tenant_id: tenant.id,
          order_id: order.id,
          customer_id: customer.id,
          payment_method: PaymentMethod.CARD,
          payment_gateway: PaymentGateway.MOCK,
          payment_status: PaymentStatus.PENDING,
          amount: 110.00,
          currency: 'AUD',
          reference_number: 'PAY-002',
        },
      });
      paymentId = payment.id;
    });

    it('should process a payment successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.payment_status).toBe(PaymentStatus.COMPLETED);
      expect(response.body.data.transaction).toBeDefined();
      expect(response.body.data.transaction.transaction_type).toBe('PAYMENT');
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .post('/api/v1/payments/00000000-0000-0000-0000-000000000000/process')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/payments/:id/refund', () => {
    let paymentId: string;

    beforeEach(async () => {
      // Create and process a payment for testing refunds
      const payment = await prisma.payment.create({
        data: {
          tenant_id: tenant.id,
          order_id: order.id,
          customer_id: customer.id,
          payment_method: PaymentMethod.CARD,
          payment_gateway: PaymentGateway.MOCK,
          payment_status: PaymentStatus.COMPLETED,
          amount: 110.00,
          currency: 'AUD',
          gateway_payment_id: `mock_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          payment_date: new Date(),
        },
      });
      paymentId = payment.id;
    });

    it('should refund a payment successfully', async () => {
      const refundData = {
        amount: 50.00,
        reason: 'Customer requested partial refund',
      };

      const response = await request(app)
        .post(`/api/v1/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.payment_status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
      expect(response.body.data.transaction.transaction_type).toBe('REFUND');
    });

    it('should return 400 for refund amount exceeding payment amount', async () => {
      const invalidRefund = {
        amount: 200.00, // More than the original payment
      };

      const response = await request(app)
        .post(`/api/v1/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidRefund);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/payments/:id', () => {
    let paymentId: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          tenant_id: tenant.id,
          order_id: order.id,
          customer_id: customer.id,
          payment_method: PaymentMethod.CARD,
          payment_gateway: PaymentGateway.MOCK,
          payment_status: PaymentStatus.COMPLETED,
          amount: 110.00,
          currency: 'AUD',
        },
      });
      paymentId = payment.id;
    });

    it('should get payment details', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(paymentId);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data).toHaveProperty('customer');
    });
  });

  describe('GET /api/v1/payments/order/:orderId', () => {
    beforeEach(async () => {
      await prisma.payment.create({
        data: {
          tenant_id: tenant.id,
          order_id: order.id,
          customer_id: customer.id,
          payment_method: PaymentMethod.CARD,
          payment_gateway: PaymentGateway.MOCK,
          payment_status: PaymentStatus.COMPLETED,
          amount: 110.00,
          currency: 'AUD',
        },
      });
    });

    it('should get payments for an order', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/order/${order.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].order_id).toBe(order.id);
    });
  });

  describe('POST /api/v1/payments/methods', () => {
    it('should save a payment method', async () => {
      const methodData = {
        customerId: customer.id,
        paymentMethod: PaymentMethod.CARD,
        paymentGateway: PaymentGateway.MOCK,
        isDefault: true,
        cardDetails: {
          lastFour: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
        },
        billingName: 'John Doe',
        billingEmail: 'john.doe@example.com',
      };

      const response = await request(app)
        .post('/api/v1/payments/methods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(methodData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.is_default).toBe(true);
      expect(response.body.data.card_last_four).toBe('4242');
    });
  });

  describe('GET /api/v1/payments/methods/customer/:customerId', () => {
    beforeEach(async () => {
      await prisma.customerPaymentMethod.create({
        data: {
          tenant_id: tenant.id,
          customer_id: customer.id,
          payment_method: PaymentMethod.CARD,
          payment_gateway: PaymentGateway.MOCK,
          is_default: true,
          card_last_four: '4242',
          card_brand: 'Visa',
          card_expiry_month: 12,
          card_expiry_year: 2025,
        },
      });
    });

    it('should get customer payment methods', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/methods/customer/${customer.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].customer_id).toBe(customer.id);
    });
  });
});