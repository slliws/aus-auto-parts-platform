import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import ordersController from '../controllers/orders.controller';
import { validateBody, validateQuery, validateParams } from '../middleware/validator';
import Joi from 'joi';

const router = Router();

router.use(authenticate);
router.use(setTenantContext);

/**
 * Orders routes for the Australian Auto Parts Platform
 * All routes are protected by authentication and tenant context middleware
 */

// Validation schemas
const createOrderSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  quoteId: Joi.string().uuid().optional(),
  orderItems: Joi.array().items(
    Joi.object({
      partId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().min(0).optional(),
    })
  ).min(1).required(),
  notes: Joi.string().optional(),
  internalNotes: Joi.string().optional(),
});

const updateOrderSchema = Joi.object({
  notes: Joi.string().optional(),
  internalNotes: Joi.string().optional(),
  status: Joi.string().valid('PENDING', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED').optional(),
});

const orderFiltersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('PENDING', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED').optional(),
  paymentStatus: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED').optional(),
  customerId: Joi.string().uuid().optional(),
  userId: Joi.string().uuid().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  minAmount: Joi.number().min(0).optional(),
  maxAmount: Joi.number().min(0).optional(),
  search: Joi.string().min(1).optional(),
});

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const customerIdParamSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
});

/**
 * GET /api/v1/orders
 * Get all orders with pagination and filtering
 */
router.get(
  '/',
  validateQuery(orderFiltersSchema),
  ordersController.getOrders
);

/**
 * GET /api/v1/orders/:id
 * Get single order by ID
 */
router.get(
  '/:id',
  validateParams(idParamSchema),
  ordersController.getOrderById
);

/**
 * POST /api/v1/orders
 * Create new order
 */
router.post(
  '/',
  validateBody(createOrderSchema),
  ordersController.createOrder
);

/**
 * PATCH /api/v1/orders/:id
 * Update existing order
 */
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateOrderSchema),
  ordersController.updateOrder
);

/**
 * POST /api/v1/orders/:id/cancel
 * Cancel order
 */
router.post(
  '/:id/cancel',
  validateParams(idParamSchema),
  ordersController.cancelOrder
);

/**
 * GET /api/v1/orders/customer/:customerId
 * Get customer's order history
 */
router.get(
  '/customer/:customerId',
  validateParams(customerIdParamSchema),
  validateQuery(Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  })),
  ordersController.getCustomerOrders
);


/**
 * GET /api/v1/orders/:id/invoice
 * Download order invoice as PDF
 */
router.get(
  '/:id/invoice',
  validateParams(idParamSchema),
  ordersController.downloadOrderInvoice
);

export default router;