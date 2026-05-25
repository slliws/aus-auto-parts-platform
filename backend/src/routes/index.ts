import quotesRoutes from './quotes.routes';
import ordersRoutes from './orders.routes';
import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import tenantsRoutes from './tenants.routes';
import partsRoutes from './parts.routes';
import customersRoutes from './customers.routes';
import vehicleRoutes from './vehicle.routes';
import searchRoutes from './search.routes';
import analyticsRoutes from './analytics.routes';
import paymentsRoutes from './payments.routes';
import apiCallTracker from '../middleware/apiCallTracker';

/**
 * Main router that combines all API routes
 * Applies the /api/v1 prefix through app.ts
 */

const router = Router();

/**
 * API call tracking — fires post-response for all authenticated routes.
 * Must be registered before route modules so the finish-event listener
 * is attached to every response that flows through this router.
 */
router.use(apiCallTracker);

/**
 * Health check endpoint
 * Used for monitoring and load balancer health checks
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * API version endpoint
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    apiVersion: 'v1',
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/parts', partsRoutes);
router.use('/customers', customersRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);
router.use('/quotes', quotesRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);

export default router;
