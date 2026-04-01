import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as analyticsController from '../controllers/analytics.controller';

/**
 * Analytics routes
 * Handles analytics and reporting endpoints
 */

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard metrics
 * @access  Private
 */
router.get('/dashboard', analyticsController.getDashboardMetrics);

/**
 * @route   GET /api/v1/analytics/reports/sales
 * @desc    Get sales report
 * @access  Private
 */
router.get('/reports/sales', analyticsController.getSalesReport);

/**
 * @route   GET /api/v1/analytics/reports/inventory
 * @desc    Get inventory report
 * @access  Private
 */
router.get('/reports/inventory', analyticsController.getInventoryReport);

/**
 * @route   GET /api/v1/analytics/reports/customers
 * @desc    Get customer analytics
 * @access  Private
 */
router.get('/reports/customers', analyticsController.getCustomerAnalytics);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Get revenue by time period
 * @access  Private
 */
router.get('/revenue', analyticsController.getRevenueByPeriod);

/**
 * @route   GET /api/v1/analytics/top-parts
 * @desc    Get top selling parts
 * @access  Private
 */
router.get('/top-parts', analyticsController.getTopSellingParts);

/**
 * @route   GET /api/v1/analytics/revenue-by-category
 * @desc    Get revenue by category
 * @access  Private
 */
router.get('/revenue-by-category', analyticsController.getRevenueByCategory);

/**
 * @route   GET /api/v1/analytics/customer-lifetime-value
 * @desc    Get customer lifetime value
 * @access  Private
 */
router.get('/customer-lifetime-value', analyticsController.getCustomerLifetimeValue);

/**
 * @route   GET /api/v1/analytics/low-stock
 * @desc    Get low stock alerts
 * @access  Private
 */
router.get('/low-stock', analyticsController.getLowStockAlerts);

/**
 * @route   POST /api/v1/analytics/clear-cache
 * @desc    Clear analytics cache
 * @access  Private
 */
router.post('/clear-cache', analyticsController.clearAnalyticsCache);

export default router;