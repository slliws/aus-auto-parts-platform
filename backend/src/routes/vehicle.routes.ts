import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validator';
import { vehiclesValidation } from '../utils/validators';
import * as vehicleController from '../controllers/vehicle.controller';

/**
 * Vehicle routes
 * Handles all vehicle management endpoints
 */

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/vehicles/search
 * @desc    Search vehicles by query
 * @access  Private
 * @note    This route must be before /:id to avoid conflicts
 */
router.get('/search', vehicleController.searchVehicles);

/**
 * @route   GET /api/v1/vehicles/makes
 * @desc    Get list of vehicle makes
 * @access  Private
 */
router.get('/makes', vehicleController.getVehicleMakes);

/**
 * @route   GET /api/v1/vehicles/models/:make
 * @desc    Get models for a specific make
 * @access  Private
 */
router.get('/models/:make', vehicleController.getModelsForMake);

/**
 * @route   POST /api/v1/vehicles/decode-vin
 * @desc    Decode VIN without saving
 * @access  Private
 */
router.post(
  '/decode-vin',
  validateBody(vehiclesValidation.decodeVin),
  vehicleController.decodeVin
);

/**
 * @route   GET /api/v1/vehicles/customer/:customerId
 * @desc    Get customer's vehicles
 * @access  Private
 */
router.get('/customer/:customerId', vehicleController.getCustomerVehicles);

/**
 * @route   GET /api/v1/vehicles
 * @desc    Get all vehicles with pagination and filtering
 * @access  Private
 */
router.get('/', vehicleController.getVehicles);

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Get single vehicle by ID
 * @access  Private
 */
router.get('/:id', vehicleController.getVehicleById);

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create new vehicle
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.post(
  '/',
  validateBody(vehiclesValidation.createVehicle),
  vehicleController.createVehicle
);

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update existing vehicle
 * @access  Private (ADMIN, MANAGER, SALES)
 */
router.put(
  '/:id',
  validateBody(vehiclesValidation.updateVehicle),
  vehicleController.updateVehicle
);

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Delete vehicle (soft delete)
 * @access  Private (ADMIN, MANAGER)
 */
router.delete('/:id', vehicleController.deleteVehicle);

export default router;