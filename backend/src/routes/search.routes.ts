/**
 * Search Routes
 * Defines API endpoints for global search functionality
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import searchController from '../controllers/search.controller';

const router = Router();

/**
 * Apply auth middleware to all search routes
 * Ensures that only authenticated users can access search functionality
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/search
 * @desc    Global search across all entities
 * @access  Private
 * @query   {string} query - Search query string
 * @query   {string} entityTypes - Comma-separated list of entity types to search (part,customer,vehicle)
 * @query   {number} page - Page number for pagination
 * @query   {number} pageSize - Number of items per page
 * @query   {string} category - Filter by part category
 * @query   {string} condition - Filter by part condition
 * @query   {string} customerType - Filter by customer type
 * @query   {string} vehicleMake - Filter by vehicle make
 * @query   {string} vehicleModel - Filter by vehicle model
 * @query   {number} minYear - Filter by minimum vehicle year
 * @query   {number} maxYear - Filter by maximum vehicle year
 */
router.get('/', searchController.globalSearch);

/**
 * @route   GET /api/v1/search/parts
 * @desc    Search only parts
 * @access  Private
 * @query   {string} query - Search query string
 * @query   {number} page - Page number for pagination
 * @query   {number} pageSize - Number of items per page
 * @query   {string} category - Filter by part category
 * @query   {string} condition - Filter by part condition
 */
router.get('/parts', searchController.searchParts);

/**
 * @route   GET /api/v1/search/customers
 * @desc    Search only customers
 * @access  Private
 * @query   {string} query - Search query string
 * @query   {number} page - Page number for pagination
 * @query   {number} pageSize - Number of items per page
 * @query   {string} customerType - Filter by customer type
 */
router.get('/customers', searchController.searchCustomers);

/**
 * @route   GET /api/v1/search/vehicles
 * @desc    Search only vehicles
 * @access  Private
 * @query   {string} query - Search query string
 * @query   {number} page - Page number for pagination
 * @query   {number} pageSize - Number of items per page
 * @query   {string} vehicleMake - Filter by vehicle make
 * @query   {string} vehicleModel - Filter by vehicle model
 * @query   {number} minYear - Filter by minimum vehicle year
 * @query   {number} maxYear - Filter by maximum vehicle year
 */
router.get('/vehicles', searchController.searchVehicles);

export default router;