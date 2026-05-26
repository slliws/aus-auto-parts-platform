import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { setTenantContext } from '../middleware/tenantContext';
import { validateBody } from '../middleware/validator';
import { quotesValidation } from '../utils/validators';
import * as quotesController from '../controllers/quotes.controller';

/**
 * Quotes routes
 * Handles all quote management endpoints
 */

const router = Router();

// All routes require authentication + tenant context
router.use(authenticate);
router.use(setTenantContext);

/**
 * PDF rate limiter — prevents in-memory buffer DoS from concurrent large PDF requests.
 * Max 10 PDF downloads per user per minute.
 */
const pdfRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req: any) => req.user?.id ?? req.ip,
  message: { success: false, message: 'Too many PDF requests — please wait a minute and try again' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
 * @route   GET /api/v1/quotes/:id/pdf
 * @desc    Download quote as PDF
 * @access  Private
 * Rate-limited: max 10 downloads per user per minute to prevent buffer DoS.
 */
router.get('/:id/pdf', pdfRateLimit, quotesController.downloadQuotePDF);

/**
 * @route   DELETE /api/v1/quotes/:id
 * @desc    Delete quote (soft delete)
 * @access  Private (ADMIN, MANAGER)
 */
router.delete('/:id', quotesController.deleteQuote);

export default router;
