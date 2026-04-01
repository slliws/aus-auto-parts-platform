import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { quotesValidation } from '../utils/validators';
import * as quotesController from '../controllers/quotes.controller';

/**
 * Quotes routes
 * Handles all quote management endpoints
 */

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/quotes/stats
 * @desc    Get quote statistics
 * @access  Private
 */
router.get('/stats', quotesController.getQuoteStats);

/**
 * @route   GET /api/v1/quotes
 * @desc    Get all quotes with pagination and filtering
 * @access  Private
 */
router.get('/', quotesController.getQuotes);

/**
 * @route   GET /api/v1/quotes/:id
 * @desc    Get single quote by ID
 * @access  Private
 */
router.get('/:id', quotesController.getQuoteById);

/**
 * @route   POST /api/v1/quotes
 * @desc    Create new quote
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.post(
  '/',
  validateBody(quotesValidation.createQuote),
  quotesController.createQuote
);

/**
 * @route   PATCH /api/v1/quotes/:id
 * @desc    Update existing quote
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.patch(
  '/:id',
  validateBody(quotesValidation.updateQuote),
  quotesController.updateQuote
);

/**
 * @route   POST /api/v1/quotes/:id/send
 * @desc    Send quote (change status from DRAFT to SENT)
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.post(
  '/:id/send',
  validateBody(quotesValidation.sendQuote),
  quotesController.sendQuote
);

/**
 * @route   POST /api/v1/quotes/:id/convert
 * @desc    Convert accepted quote to order
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.post('/:id/convert', quotesController.convertQuote);

/**
 * @route   DELETE /api/v1/quotes/:id
 * @desc    Delete quote (soft delete)
 * @access  Private (ADMIN, MANAGER)
 */
router.delete('/:id', quotesController.deleteQuote);

export default router;