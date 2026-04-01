import { Router } from 'express';
import {
  createPayment,
  processPayment,
  refundPayment,
  getPayment,
  getOrderPayments,
  checkPaymentStatus,
  savePaymentMethod,
  getCustomerPaymentMethods,
  deletePaymentMethod,
  createAndProcessPayment,
} from '../controllers/payments.controller';
import { authenticate } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';

const router = Router();

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(setTenantContext);

// ============================================================================
// PAYMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/payments
 * @desc    Create a new payment
 * @access  Private
 */
router.post('/', createPayment);

/**
 * @route   POST /api/payments/create-and-process
 * @desc    Create and immediately process a payment
 * @access  Private
 */
router.post('/create-and-process', createAndProcessPayment);

/**
 * @route   POST /api/payments/:id/process
 * @desc    Process a pending payment
 * @access  Private
 */
router.post('/:id/process', processPayment);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Refund a completed payment
 * @access  Private
 */
router.post('/:id/refund', refundPayment);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details by ID
 * @access  Private
 */
router.get('/:id', getPayment);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get all payments for an order
 * @access  Private
 */
router.get('/order/:orderId', getOrderPayments);

/**
 * @route   GET /api/payments/:id/status
 * @desc    Check payment status from gateway
 * @access  Private
 */
router.get('/:id/status', checkPaymentStatus);

// ============================================================================
// PAYMENT METHOD ROUTES
// ============================================================================

/**
 * @route   POST /api/payments/methods
 * @desc    Save a customer payment method
 * @access  Private
 */
router.post('/methods', savePaymentMethod);

/**
 * @route   GET /api/payments/methods/customer/:customerId
 * @desc    Get all payment methods for a customer
 * @access  Private
 */
router.get('/methods/customer/:customerId', getCustomerPaymentMethods);

/**
 * @route   DELETE /api/payments/methods/:id
 * @desc    Delete a payment method
 * @access  Private
 */
router.delete('/methods/:id', deletePaymentMethod);

export default router;