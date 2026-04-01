import apiClient from './api.service';

/**
 * Dashboard Statistics Interfaces
 */
export interface DashboardStats {
  parts: PartsStats;
  customers: CustomersStats;
  orders: OrdersStats;
  revenue: RevenueStats;
}

export interface PartsStats {
  totalParts: number;
  lowStockCount: number;
  categoriesDistribution: CategoryDistribution[];
  recentlyAdded: RecentPart[];
}

export interface CustomersStats {
  totalCustomers: number;
  newThisMonth: number;
  byType: CustomerTypeDistribution[];
  recentlyAdded: RecentCustomer[];
}

export interface OrdersStats {
  totalOrders: number;
  thisMonth: number;
  pending: number;
  recent: RecentOrder[];
}

export interface RevenueStats {
  thisMonth: number;
  lastMonth: number;
  percentageChange: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface CustomerTypeDistribution {
  type: 'RETAIL' | 'TRADE' | 'WHOLESALE';
  count: number;
  percentage: number;
}

export interface RecentPart {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  createdAt: string;
}

export interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  type: 'RETAIL' | 'TRADE' | 'WHOLESALE';
  createdAt: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

/**
 * Fetch Dashboard Statistics
 * Aggregates statistics from multiple endpoints
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch all statistics in parallel
    const [partsResponse, customersResponse] = await Promise.all([
      apiClient.get('/api/parts/stats'),
      apiClient.get('/api/customers/stats'),
    ]);

    // Calculate parts statistics
    const partsStats: PartsStats = {
      totalParts: partsResponse.data.total || 0,
      lowStockCount: partsResponse.data.lowStock || 0,
      categoriesDistribution: partsResponse.data.categoriesDistribution || [],
      recentlyAdded: partsResponse.data.recent || [],
    };

    // Calculate customer statistics
    const customersStats: CustomersStats = {
      totalCustomers: customersResponse.data.total || 0,
      newThisMonth: customersResponse.data.newThisMonth || 0,
      byType: customersResponse.data.byType || [],
      recentlyAdded: customersResponse.data.recent || [],
    };

    // Placeholder orders statistics (to be implemented)
    const ordersStats: OrdersStats = {
      totalOrders: 0,
      thisMonth: 0,
      pending: 0,
      recent: [],
    };

    // Placeholder revenue statistics (to be implemented)
    const revenueStats: RevenueStats = {
      thisMonth: 0,
      lastMonth: 0,
      percentageChange: 0,
    };

    return {
      parts: partsStats,
      customers: customersStats,
      orders: ordersStats,
      revenue: revenueStats,
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    throw error;
  }
};

/**
 * Fetch Parts Statistics
 */
export const fetchPartsStats = async (): Promise<PartsStats> => {
  try {
    const response = await apiClient.get('/api/parts/stats');
    return {
      totalParts: response.data.total || 0,
      lowStockCount: response.data.lowStock || 0,
      categoriesDistribution: response.data.categoriesDistribution || [],
      recentlyAdded: response.data.recent || [],
    };
  } catch (error) {
    console.error('Error fetching parts statistics:', error);
    throw error;
  }
};

/**
 * Fetch Customer Statistics
 */
export const fetchCustomersStats = async (): Promise<CustomersStats> => {
  try {
    const response = await apiClient.get('/api/customers/stats');
    return {
      totalCustomers: response.data.total || 0,
      newThisMonth: response.data.newThisMonth || 0,
      byType: response.data.byType || [],
      recentlyAdded: response.data.recent || [],
    };
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    throw error;
  }
};

/**
 * Calculate statistics from local data (fallback)
 * Used when backend endpoints are not available
 */
export const calculateLocalStats = (parts: any[], customers: any[]): DashboardStats => {
  // Calculate parts statistics
  const categoriesMap = new Map<string, number>();
  let lowStockCount = 0;

  parts.forEach(part => {
    // Count by category
    const count = categoriesMap.get(part.category) || 0;
    categoriesMap.set(part.category, count + 1);

    // Count low stock
    if (part.quantityInStock <= part.reorderLevel) {
      lowStockCount++;
    }
  });

  const categoriesDistribution: CategoryDistribution[] = Array.from(categoriesMap.entries()).map(
    ([category, count]) => ({
      category,
      count,
      percentage: (count / parts.length) * 100,
    })
  );

  // Get recently added parts
  const recentParts = [...parts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(part => ({
      id: part.id,
      partNumber: part.partNumber,
      name: part.name,
      category: part.category,
      createdAt: part.createdAt,
    }));

  // Calculate customer statistics
  const typeMap = new Map<string, number>();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let newThisMonth = 0;

  customers.forEach(customer => {
    // Count by type
    const count = typeMap.get(customer.type) || 0;
    typeMap.set(customer.type, count + 1);

    // Count new this month
    if (new Date(customer.createdAt) >= startOfMonth) {
      newThisMonth++;
    }
  });

  const byType: CustomerTypeDistribution[] = Array.from(typeMap.entries()).map(
    ([type, count]) => ({
      type: type as 'RETAIL' | 'TRADE' | 'WHOLESALE',
      count,
      percentage: (count / customers.length) * 100,
    })
  );

  // Get recently added customers
  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      type: customer.type,
      createdAt: customer.createdAt,
    }));

  return {
    parts: {
      totalParts: parts.length,
      lowStockCount,
      categoriesDistribution,
      recentlyAdded: recentParts,
    },
    customers: {
      totalCustomers: customers.length,
      newThisMonth,
      byType,
      recentlyAdded: recentCustomers,
    },
    orders: {
      totalOrders: 0,
      thisMonth: 0,
      pending: 0,
      recent: [],
    },
    revenue: {
      thisMonth: 0,
      lastMonth: 0,
      percentageChange: 0,
    },
  };
};