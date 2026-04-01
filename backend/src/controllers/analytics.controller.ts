import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import * as analyticsService from '../services/analytics.service';
import { logger } from '../utils/logger';

/**
 * Analytics controller
 * Handles HTTP requests for analytics and reporting
 */

/**
 * Get dashboard metrics
 * @route GET /api/v1/analytics/dashboard
 */
export const getDashboardMetrics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const metrics = await analyticsService.getDashboardMetrics(tenantId);

    const response: ApiResponse = {
      success: true,
      data: { metrics },
    };

    logger.info('Dashboard metrics retrieved', { tenantId, userId });
    res.status(200).json(response);
  }
);

/**
 * Get sales report
 * @route GET /api/v1/analytics/reports/sales
 */
export const getSalesReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse date range parameters
    const dateRange: analyticsService.DateRange = {};
    if (req.query.startDate) {
      dateRange.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      dateRange.endDate = new Date(req.query.endDate as string);
    }

    // Parse period parameter
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'monthly';

    const reportData = await analyticsService.getSalesReport(tenantId, dateRange, period);

    const response: ApiResponse = {
      success: true,
      data: { report: reportData },
    };

    logger.info('Sales report generated', { tenantId, userId, dateRange, period });
    res.status(200).json(response);
  }
);

/**
 * Get inventory report
 * @route GET /api/v1/analytics/reports/inventory
 */
export const getInventoryReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const reportData = await analyticsService.getInventoryReport(tenantId);

    const response: ApiResponse = {
      success: true,
      data: { report: reportData },
    };

    logger.info('Inventory report generated', { tenantId, userId });
    res.status(200).json(response);
  }
);

/**
 * Get customer analytics
 * @route GET /api/v1/analytics/reports/customers
 */
export const getCustomerAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    // Parse date range parameters
    const dateRange: analyticsService.DateRange = {};
    if (req.query.startDate) {
      dateRange.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      dateRange.endDate = new Date(req.query.endDate as string);
    }

    const analyticsData = await analyticsService.getCustomerAnalytics(tenantId, dateRange);

    const response: ApiResponse = {
      success: true,
      data: { analytics: analyticsData },
    };

    logger.info('Customer analytics generated', { tenantId, userId, dateRange });
    res.status(200).json(response);
  }
);

/**
 * Get revenue by time period
 * @route GET /api/v1/analytics/revenue
 */
export const getRevenueByPeriod = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const period = req.query.period as string || 'monthly';
    const limit = parseInt(req.query.limit as string) || 12; // Default last 12 periods

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - limit);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - (limit * 7));
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - limit);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - limit);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - limit);
    }

    const reportData = await analyticsService.getSalesReport(
      tenantId,
      { startDate, endDate },
      period as any
    );

    const response: ApiResponse = {
      success: true,
      data: {
        period,
        revenueByPeriod: reportData.revenueByPeriod,
        summary: reportData.summary,
      },
    };

    logger.info('Revenue by period retrieved', { tenantId, userId, period, limit });
    res.status(200).json(response);
  }
);

/**
 * Get top selling parts
 * @route GET /api/v1/analytics/top-parts
 */
export const getTopSellingParts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const dateRange: analyticsService.DateRange = {};

    if (req.query.startDate) {
      dateRange.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      dateRange.endDate = new Date(req.query.endDate as string);
    }

    const reportData = await analyticsService.getSalesReport(tenantId, dateRange);

    const response: ApiResponse = {
      success: true,
      data: {
        topParts: reportData.topSellingParts.slice(0, limit),
        summary: reportData.summary,
      },
    };

    logger.info('Top selling parts retrieved', { tenantId, userId, limit, dateRange });
    res.status(200).json(response);
  }
);

/**
 * Get revenue by category
 * @route GET /api/v1/analytics/revenue-by-category
 */
export const getRevenueByCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const dateRange: analyticsService.DateRange = {};
    if (req.query.startDate) {
      dateRange.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      dateRange.endDate = new Date(req.query.endDate as string);
    }

    const reportData = await analyticsService.getSalesReport(tenantId, dateRange);

    const response: ApiResponse = {
      success: true,
      data: {
        categories: reportData.revenueByCategory,
        summary: reportData.summary,
      },
    };

    logger.info('Revenue by category retrieved', { tenantId, userId, dateRange });
    res.status(200).json(response);
  }
);

/**
 * Get customer lifetime value
 * @route GET /api/v1/analytics/customer-lifetime-value
 */
export const getCustomerLifetimeValue = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const analyticsData = await analyticsService.getCustomerAnalytics(tenantId);

    const response: ApiResponse = {
      success: true,
      data: {
        lifetimeValue: analyticsData.customerLifetimeValue,
        summary: analyticsData.summary,
      },
    };

    logger.info('Customer lifetime value retrieved', { tenantId, userId });
    res.status(200).json(response);
  }
);

/**
 * Get low stock alerts
 * @route GET /api/v1/analytics/low-stock
 */
export const getLowStockAlerts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    const reportData = await analyticsService.getInventoryReport(tenantId);

    const response: ApiResponse = {
      success: true,
      data: {
        lowStockItems: reportData.stockLevels.filter(item => item.status === 'LOW_STOCK'),
        outOfStockItems: reportData.stockLevels.filter(item => item.status === 'OUT_OF_STOCK'),
        summary: reportData.summary,
      },
    };

    logger.info('Low stock alerts retrieved', { tenantId, userId });
    res.status(200).json(response);
  }
);

/**
 * Clear analytics cache
 * @route POST /api/v1/analytics/clear-cache
 */
export const clearAnalyticsCache = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        message: 'Tenant context not found',
      };
      res.status(400).json(response);
      return;
    }

    await analyticsService.clearAnalyticsCache(tenantId);

    const response: ApiResponse = {
      success: true,
      message: 'Analytics cache cleared successfully',
    };

    logger.info('Analytics cache cleared', { tenantId, userId });
    res.status(200).json(response);
  }
);

export default {
  getDashboardMetrics,
  getSalesReport,
  getInventoryReport,
  getCustomerAnalytics,
  getRevenueByPeriod,
  getTopSellingParts,
  getRevenueByCategory,
  getCustomerLifetimeValue,
  getLowStockAlerts,
  clearAnalyticsCache,
};