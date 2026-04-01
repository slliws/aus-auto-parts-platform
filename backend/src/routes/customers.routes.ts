import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { customersValidation } from '../utils/validators';
import * as customersController from '../controllers/customers.controller';

/**
 * Customers routes
 * Handles all customer management endpoints
 */

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/customers/search
 * @desc    Search customers by query
 * @access  Private
 * @note    This route must be before /:id to avoid conflicts
 */
router.get('/search', customersController.searchCustomers);

/**
 * @route   GET /api/v1/customers/stats
 * @desc    Get customer statistics
 * @access  Private
 */
router.get('/stats', customersController.getCustomerStats);

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers with pagination and filtering
 * @access  Private
 */
router.get('/', customersController.getCustomers);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get single customer by ID
 * @access  Private
 */
router.get('/:id', customersController.getCustomerById);

/**
 * @route   GET /api/v1/customers/:id/orders
 * @desc    Get customer's order history
 * @access  Private
 */
router.get('/:id/orders', customersController.getCustomerOrders);

/**
 * @route   POST /api/v1/customers
 * @desc    Create new customer
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.post(
  '/',
  validateBody(customersValidation.createCustomer),
  customersController.createCustomer
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update existing customer
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.put(
  '/:id',
  validateBody(customersValidation.updateCustomer),
  customersController.updateCustomer
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer (soft delete)
 * @access  Private (ADMIN, MANAGER)
 */
router.delete('/:id', customersController.deleteCustomer);

export default router;