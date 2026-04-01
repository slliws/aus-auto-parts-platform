import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { partsValidation } from '../utils/validators';
import * as partsController from '../controllers/parts.controller';

/**
 * Parts routes
 * Handles all parts inventory management endpoints
 */

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/parts/search
 * @desc    Search parts by query
 * @access  Private
 * @note    This route must be before /:id to avoid conflicts
 */
router.get('/search', partsController.searchParts);

/**
 * @route   GET /api/v1/parts/low-stock
 * @desc    Get low stock parts
 * @access  Private
 */
router.get('/low-stock', partsController.getLowStockParts);

/**
 * @route   GET /api/v1/parts/categories
 * @desc    Get all unique categories
 * @access  Private
 */
router.get('/categories', partsController.getCategories);

/**
 * @route   GET /api/v1/parts/category/:category
 * @desc    Get parts by category
 * @access  Private
 */
router.get('/category/:category', partsController.getPartsByCategory);

/**
 * @route   GET /api/v1/parts
 * @desc    Get all parts with pagination and filtering
 * @access  Private
 */
router.get('/', partsController.getParts);

/**
 * @route   GET /api/v1/parts/:id
 * @desc    Get single part by ID
 * @access  Private
 */
router.get('/:id', partsController.getPartById);

/**
 * @route   POST /api/v1/parts
 * @desc    Create new part
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.post(
  '/',
  validateBody(partsValidation.createPart),
  partsController.createPart
);

/**
 * @route   PUT /api/v1/parts/:id
 * @desc    Update existing part
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.put(
  '/:id',
  validateBody(partsValidation.updatePart),
  partsController.updatePart
);

/**
 * @route   DELETE /api/v1/parts/:id
 * @desc    Delete part (soft delete)
 * @access  Private (ADMIN, MANAGER)
 */
router.delete('/:id', partsController.deletePart);

export default router;