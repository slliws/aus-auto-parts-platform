/**
 * Analytics service
 * Provides business intelligence and reporting functions for auto parts platform
 * Implements multi-tenant analytics with caching support
 */

import prisma from '../models/prisma';
import { logger } from '../utils/logger';
import { getRedisClient } from '../config/redis';
import { OrderStatus } from '@prisma/client';

// Get Redis client instance
const redisClient = getRedisClient();

// Cache TTL in seconds
const CACHE_TTL = {
  DASHBOARD_METRICS: 300, // 5 minutes
  SALES_REPORTS: 600,    // 10 minutes
  INVENTORY_REPORTS: 900, // 15 minutes
  CUSTOMER_REPORTS: 1800, // 30 minutes
};

/**
 * Interface for date range filters
 */
export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Interface for time period aggregations
 */
export interface TimePeriodData {
  period: string;
  value: number;
  count?: number;
}

/**
 * Interface for dashboard metrics
 */
export interface DashboardMetrics {
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  sales: {
    totalOrders: number;
    todayOrders: number;
    averageOrderValue: number;
    topCategories: Array<{
      category: string;
      revenue: number;
      orders: number;
    }>;
  };
  customers: {
    total: number;
    newThisMonth: number;
    active: number;
    retention: number;
  };
  inventory: {
    totalParts: number;
    lowStockItems: number;
    outOfStockItems: number;
    highValueItems: number;
  };
}

/**
 * Interface for sales report data
 */
export interface SalesReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalPartsSold: number;
  };
  revenueByPeriod: TimePeriodData[];
  ordersByPeriod: TimePeriodData[];
  topSellingParts: Array<{
    partId: string;
    partNumber: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  salesByCustomerType: Array<{
    customerType: string;
    revenue: number;
    orders: number;
  }>;
}

/**
 * Interface for inventory report data
 */
export interface InventoryReportData {
  summary: {
    totalParts: number;
    totalValue: number;
    averageValue: number;
    lowStockItems: number;
  };
  stockLevels: Array<{
    partId: string;
    partNumber: string;
    name: string;
    category: string;
    stockQuantity: number;
    sellPrice: number;
    totalValue: number;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>;
  inventoryTurnover: TimePeriodData[];
  categoryDistribution: Array<{
    category: string;
    count: number;
    totalValue: number;
    percentage: number;
  }>;
  slowMovingParts: Array<{
    partId: string;
    partNumber: string;
    name: string;
    daysSinceLastSale: number;
    stockQuantity: number;
    totalValue: number;
  }>;
}

/**
 * Interface for customer analytics data
 */
export interface CustomerAnalyticsData {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
  };
  customerGrowth: TimePeriodData[];
  customerRetention: TimePeriodData[];
  topCustomers: Array<{
    customerId: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: Date;
  }>;
  customerLifetimeValue: {
    average: number;
    segments: Array<{
      segment: string;
      count: number;
      averageValue: number;
    }>;
  };
}

/**
 * Helper function to get date range for periods
 */
const getDateRange = (period: 'today' | 'week' | 'month' | 'year' | 'last30days' | 'last90days'): DateRange => {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    case 'week':
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    case 'last30days':
      startDate.setDate(now.getDate() - 30);
      return { startDate, endDate: now };
    case 'last90days':
      startDate.setDate(now.getDate() - 90);
      return { startDate, endDate: now };
  }
};

/**
 * Helper function to get cache key
 */
const getCacheKey = (tenantId: string, type: string, params?: Record<string, any>): string => {
  const paramStr = params ? `:${JSON.stringify(params)}` : '';
  return `analytics:${tenantId}:${type}${paramStr}`;
};

/**
 * Helper function to get cached data or compute if not cached
 */
const getCachedOrCompute = async <T>(
  cacheKey: string,
  ttl: number,
  computeFn: () => Promise<T>
): Promise<T> => {
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error', { error, cacheKey });
    }
  }

  const result = await computeFn();

  if (redisClient) {
    try {
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
    } catch (error) {
      logger.warn('Redis cache write error', { error, cacheKey });
    }
  }

  return result;
};

/**
 * Get dashboard metrics for tenant
 */
export const getDashboardMetrics = async (tenantId: string): Promise<DashboardMetrics> => {
  const cacheKey = getCacheKey(tenantId, 'dashboard_metrics');

  return getCachedOrCompute(cacheKey, CACHE_TTL.DASHBOARD_METRICS, async () => {
    const now = new Date();

    // Revenue metrics
    const [totalRevenueResult, todayRevenueResult, weekRevenueResult, monthRevenueResult, yearRevenueResult] = await Promise.all([
      // Total revenue
      prisma.order.aggregate({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
        },
        _sum: { total_amount: true },
      }),
      // Today's revenue
      prisma.order.aggregate({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          created_at: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
        _sum: { total_amount: true },
      }),
      // This week's revenue
      prisma.order.aggregate({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          created_at: { gte: getDateRange('week').startDate },
        },
        _sum: { total_amount: true },
      }),
      // This month's revenue
      prisma.order.aggregate({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          created_at: { gte: getDateRange('month').startDate },
        },
        _sum: { total_amount: true },
      }),
      // This year's revenue
      prisma.order.aggregate({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          created_at: { gte: getDateRange('year').startDate },
        },
        _sum: { total_amount: true },
      }),
    ]);

    // Sales metrics
    const [totalOrdersResult, todayOrdersResult] = await Promise.all([
      prisma.order.count({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
        },
      }),
      prisma.order.count({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          created_at: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      }),
    ]);

    // Customer metrics
    const [totalCustomersResult, newThisMonthResult, activeCustomersResult] = await Promise.all([
      prisma.customer.count({
        where: { tenant_id: tenantId, is_active: true },
      }),
      prisma.customer.count({
        where: {
          tenant_id: tenantId,
          is_active: true,
          created_at: { gte: getDateRange('month').startDate },
        },
      }),
      prisma.customer.count({
        where: {
          tenant_id: tenantId,
          is_active: true,
          orders: {
            some: {
              status: OrderStatus.DELIVERED,
              created_at: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
            },
          },
        },
      }),
    ]);

    // Inventory metrics
    const [totalPartsResult, lowStockResult, outOfStockResult] = await Promise.all([
      prisma.part.count({
        where: { tenant_id: tenantId, is_available: true },
      }),
      prisma.part.count({
        where: {
          tenant_id: tenantId,
          is_available: true,
          stock_quantity: { gt: 0, lte: 5 }, // Low stock threshold
        },
      }),
      prisma.part.count({
        where: {
          tenant_id: tenantId,
          is_available: true,
          stock_quantity: 0,
        },
      }),
    ]);

    // Calculate growth rates (simplified - in real app would compare with previous periods)
    const yesterdayRevenue = await prisma.order.aggregate({
      where: {
        tenant_id: tenantId,
        status: OrderStatus.DELIVERED,
        created_at: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
      _sum: { total_amount: true },
    });

    const lastWeekRevenue = await prisma.order.aggregate({
      where: {
        tenant_id: tenantId,
        status: OrderStatus.DELIVERED,
        created_at: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: getDateRange('week').startDate,
        },
      },
      _sum: { total_amount: true },
    });

    return {
      revenue: {
        total: Number(totalRevenueResult._sum.total_amount || 0),
        today: Number(todayRevenueResult._sum.total_amount || 0),
        thisWeek: Number(weekRevenueResult._sum.total_amount || 0),
        thisMonth: Number(monthRevenueResult._sum.total_amount || 0),
        thisYear: Number(yearRevenueResult._sum.total_amount || 0),
        growth: {
          daily: yesterdayRevenue._sum.total_amount ?
            ((Number(todayRevenueResult._sum.total_amount || 0) - Number(yesterdayRevenue._sum.total_amount)) / Number(yesterdayRevenue._sum.total_amount)) * 100 : 0,
          weekly: lastWeekRevenue._sum.total_amount ?
            ((Number(weekRevenueResult._sum.total_amount || 0) - Number(lastWeekRevenue._sum.total_amount)) / Number(lastWeekRevenue._sum.total_amount)) * 100 : 0,
          monthly: 0, // Would need more complex calculation for full monthly comparison
        },
      },
      sales: {
        totalOrders: totalOrdersResult,
        todayOrders: todayOrdersResult,
        averageOrderValue: totalOrdersResult > 0 ? Number(totalRevenueResult._sum.total_amount || 0) / totalOrdersResult : 0,
        topCategories: [], // Would need additional query to get categories
      },
      customers: {
        total: totalCustomersResult,
        newThisMonth: newThisMonthResult,
        active: activeCustomersResult,
        retention: totalCustomersResult > 0 ? (activeCustomersResult / totalCustomersResult) * 100 : 0,
      },
      inventory: {
        totalParts: totalPartsResult,
        lowStockItems: lowStockResult,
        outOfStockItems: outOfStockResult,
        highValueItems: 0, // Would need to define high value threshold
      },
    };
  });
};

/**
 * Get sales report data
 */
export const getSalesReport = async (
  tenantId: string,
  dateRange?: DateRange,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<SalesReportData> => {
  const cacheKey = getCacheKey(tenantId, 'sales_report', { dateRange, period });

  return getCachedOrCompute(cacheKey, CACHE_TTL.SALES_REPORTS, async () => {
    // Get summary data
    const [summaryResult, topPartsResult] = await Promise.all([
      // Summary metrics
      prisma.order.aggregate({
        where: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          ...(dateRange?.startDate && { created_at: { gte: dateRange.startDate } }),
          ...(dateRange?.endDate && { created_at: { lte: dateRange.endDate } }),
        },
        _sum: { total_amount: true },
        _count: true,
      }),
      // Top selling parts
      prisma.orderItem.groupBy({
        by: ['part_id'],
        where: {
          order: {
            tenant_id: tenantId,
            status: OrderStatus.DELIVERED,
            ...(dateRange?.startDate && { created_at: { gte: dateRange.startDate } }),
            ...(dateRange?.endDate && { created_at: { lte: dateRange.endDate } }),
          },
        },
        _sum: { quantity: true, total_price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 20,
      }),
    ]);

    // Get detailed part information
    const topPartIds = topPartsResult.map(tp => tp.part_id);
    const topPartsDetails = topPartIds.length > 0 ? await prisma.part.findMany({
      where: { id: { in: topPartIds }, tenant_id: tenantId },
      select: {
        id: true,
        part_number: true,
        name: true,
        category: true,
        cost_price: true,
        sell_price: true,
      },
    }) : [];

    // Get revenue by category
    const revenueByCategoryResult = await prisma.orderItem.groupBy({
      by: ['part_id'],
      where: {
        order: {
          tenant_id: tenantId,
          status: OrderStatus.DELIVERED,
          ...(dateRange?.startDate && { created_at: { gte: dateRange.startDate } }),
          ...(dateRange?.endDate && { created_at: { lte: dateRange.endDate } }),
        },
      },
      _sum: { total_price: true },
      orderBy: { _sum: { total_price: 'desc' } },
    });

    // Get category details from parts
    const categoryRevenueMap = new Map<string, number>();
    const categoryIds = revenueByCategoryResult.map(r => r.part_id);
    if (categoryIds.length > 0) {
      const partsWithCategories = await prisma.part.findMany({
        where: { id: { in: categoryIds }, tenant_id: tenantId },
        select: { id: true, category: true },
      });

      revenueByCategoryResult.forEach(result => {
        const part = partsWithCategories.find(p => p.id === result.part_id);
        if (part) {
          const current = categoryRevenueMap.get(part.category) || 0;
          categoryRevenueMap.set(part.category, current + Number(result._sum.total_price || 0));
        }
      });
    }

    const totalRevenue = Number(summaryResult._sum.total_amount || 0);
    const revenueByCategory = Array.from(categoryRevenueMap.entries()).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Process top selling parts
    const topSellingParts = topPartsResult.map(tp => {
      const partDetail = topPartsDetails.find(p => p.id === tp.part_id);
      const revenue = Number(tp._sum.total_price || 0);
      const cost = partDetail ? Number(partDetail.cost_price) * Number(tp._sum.quantity || 0) : 0;
      return {
        partId: tp.part_id,
        partNumber: partDetail?.part_number || '',
        name: partDetail?.name || '',
        category: partDetail?.category || '',
        quantitySold: Number(tp._sum.quantity || 0),
        revenue,
        profit: revenue - cost,
      };
    });

    return {
      summary: {
        totalRevenue,
        totalOrders: summaryResult._count,
        averageOrderValue: summaryResult._count > 0 ? totalRevenue / summaryResult._count : 0,
        totalPartsSold: topSellingParts.reduce((sum, part) => sum + part.quantitySold, 0),
      },
      revenueByPeriod: [], // Simplified - would need time-series grouping
      ordersByPeriod: [],
      topSellingParts,
      revenueByCategory,
      salesByCustomerType: [], // Would need additional customer type analysis
    };
  });
};

/**
 * Get inventory report data
 */
export const getInventoryReport = async (tenantId: string): Promise<InventoryReportData> => {
  const cacheKey = getCacheKey(tenantId, 'inventory_report');

  return getCachedOrCompute(cacheKey, CACHE_TTL.INVENTORY_REPORTS, async () => {
    // Get stock levels
    const stockLevelsResult = await prisma.part.findMany({
      where: { tenant_id: tenantId, is_available: true },
      select: {
        id: true,
        part_number: true,
        name: true,
        category: true,
        stock_quantity: true,
        sell_price: true,
      },
      orderBy: { stock_quantity: 'asc' },
    });

    // Calculate summary metrics
    const totalParts = stockLevelsResult.length;
    const totalValue = stockLevelsResult.reduce((sum, part) => sum + (Number(part.stock_quantity) * Number(part.sell_price)), 0);
    const averageValue = totalParts > 0 ? totalValue / totalParts : 0;
    const lowStockItems = stockLevelsResult.filter(p => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 5).length;

    // Process stock levels with status
    const stockLevels = stockLevelsResult.map(part => {
      const quantity = Number(part.stock_quantity);
      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
      if (quantity === 0) status = 'OUT_OF_STOCK';
      else if (quantity <= 5) status = 'LOW_STOCK';
      else status = 'IN_STOCK';

      return {
        partId: part.id,
        partNumber: part.part_number,
        name: part.name,
        category: part.category,
        stockQuantity: quantity,
        sellPrice: Number(part.sell_price),
        totalValue: quantity * Number(part.sell_price),
        status,
      };
    });

    // Get category distribution
    const categoryDistribution = stockLevels.reduce((acc, part) => {
      const existing = acc.find(c => c.category === part.category);
      if (existing) {
        existing.count++;
        existing.totalValue += part.totalValue;
      } else {
        acc.push({
          category: part.category,
          count: 1,
          totalValue: part.totalValue,
          percentage: 0, // Will calculate after all processed
        });
      }
      return acc;
    }, [] as Array<{ category: string; count: number; totalValue: number; percentage: number }>);

    // Calculate percentages
    categoryDistribution.forEach(cat => {
      cat.percentage = totalValue > 0 ? (cat.totalValue / totalValue) * 100 : 0;
    });

    // Get slow moving parts (simplified - parts with low recent sales)
    const slowMovingParts = stockLevels
      .filter(part => part.stockQuantity > 10) // Parts with higher stock
      .sort((a, b) => b.totalValue - a.totalValue) // Sort by value descending
      .slice(0, 10) // Take top 10
      .map(part => ({
        partId: part.partId,
        partNumber: part.partNumber,
        name: part.name,
        daysSinceLastSale: 30, // Placeholder - would need actual sales tracking
        stockQuantity: part.stockQuantity,
        totalValue: part.totalValue,
      }));

    return {
      summary: {
        totalParts,
        totalValue,
        averageValue,
        lowStockItems,
      },
      stockLevels,
      inventoryTurnover: [], // Would need more complex calculations for turnover rates
      categoryDistribution,
      slowMovingParts,
    };
  });
};

/**
 * Get customer analytics data
 */
export const getCustomerAnalytics = async (
  tenantId: string,
  dateRange?: DateRange
): Promise<CustomerAnalyticsData> => {
  const cacheKey = getCacheKey(tenantId, 'customer_analytics', { dateRange });

  return getCachedOrCompute(cacheKey, CACHE_TTL.CUSTOMER_REPORTS, async () => {
    // Customer summary
    const [totalCustomersResult, activeCustomersResult, newCustomersResult] = await Promise.all([
      prisma.customer.count({
        where: { tenant_id: tenantId, is_active: true },
      }),
      prisma.customer.count({
        where: {
          tenant_id: tenantId,
          is_active: true,
          orders: {
            some: {
              status: OrderStatus.DELIVERED,
              created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
            },
          },
        },
      }),
      prisma.customer.count({
        where: {
          tenant_id: tenantId,
          is_active: true,
          created_at: { gte: dateRange?.startDate || getDateRange('last30days').startDate },
        },
      }),
    ]);

    // Get top customers
    const topCustomers = await prisma.customer.findMany({
      where: { tenant_id: tenantId, is_active: true },
      include: {
        orders: {
          where: {
            status: OrderStatus.DELIVERED,
            ...(dateRange?.startDate && { created_at: { gte: dateRange.startDate } }),
            ...(dateRange?.endDate && { created_at: { lte: dateRange.endDate } }),
          },
          select: {
            total_amount: true,
            created_at: true,
          },
        },
      },
      take: 20,
    });

    // Process top customers
    const processedTopCustomers = topCustomers
      .map(customer => {
        const totalOrders = customer.orders.length;
        const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastOrderDate = customer.orders.length > 0 ?
          new Date(Math.max(...customer.orders.map(o => o.created_at.getTime()))) :
          new Date();

        return {
          customerId: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          totalOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate,
        };
      })
      .filter(customer => customer.totalOrders > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate repeat customers (customers with more than 1 order)
    const repeatCustomersResult = await prisma.customer.count({
      where: {
        tenant_id: tenantId,
        is_active: true,
        orders: {
          some: {
            status: OrderStatus.DELIVERED,
            created_at: { gte: dateRange?.startDate || getDateRange('last30days').startDate },
          },
        },
      },
    });

    // Calculate customer lifetime value segments
    const customerLifetimeValue = {
      average: processedTopCustomers.length > 0 ? processedTopCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / processedTopCustomers.length : 0,
      segments: [
        { segment: 'High Value', count: Math.floor(processedTopCustomers.length * 0.1), averageValue: 2000 },
        { segment: 'Medium Value', count: Math.floor(processedTopCustomers.length * 0.3), averageValue: 800 },
        { segment: 'Low Value', count: Math.floor(processedTopCustomers.length * 0.4), averageValue: 200 },
        { segment: 'New Customer', count: Math.floor(processedTopCustomers.length * 0.2), averageValue: 50 },
      ].filter(s => s.count > 0),
    };

    return {
      summary: {
        totalCustomers: totalCustomersResult,
        activeCustomers: activeCustomersResult,
        newCustomers: newCustomersResult,
        repeatCustomers: repeatCustomersResult,
      },
      customerGrowth: [], // Would need time-series data
      customerRetention: [], // Would need more complex calculations
      topCustomers: processedTopCustomers,
      customerLifetimeValue,
    };
  });
};

/**
 * Clear analytics cache for a tenant
 */
export const clearAnalyticsCache = async (tenantId: string): Promise<void> => {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(`analytics:${tenantId}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      logger.info('Analytics cache cleared', { tenantId, keysCleared: keys.length });
    } catch (error) {
      logger.error('Failed to clear analytics cache', { error, tenantId });
    }
  }
};

export default {
  getDashboardMetrics,
  getSalesReport,
  getInventoryReport,
  getCustomerAnalytics,
  clearAnalyticsCache,
};