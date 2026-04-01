import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Grid, 
  Box, 
  Typography,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  People as PeopleIcon,
  WarningAmber as WarningIcon,
  ShoppingCart as ShoppingCartIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import MetricCard from '../components/organisms/dashboard/MetricCard';
import QuickActionsCard, { defaultQuickActions } from '../components/organisms/dashboard/QuickActionsCard';
import RecentActivityCard from '../components/organisms/dashboard/RecentActivityCard';
import ChartCard from '../components/organisms/dashboard/ChartCard';

import { AppDispatch, RootState } from '../store';
import { fetchDashboardStats, calculateLocalStats } from '../store/slices/statisticsSlice';
import { fetchParts } from '../store/slices/partsSlice';
import { fetchCustomers } from '../store/slices/customersSlice';

/**
 * DashboardPage Component
 * Main dashboard of the auto parts application with metrics, quick actions and analytics
 */
const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  
  // Selectors
  const { dashboardStats, loading } = useSelector((state: RootState) => state.statistics);
  const { parts } = useSelector((state: RootState) => state.parts);
  const { customers } = useSelector((state: RootState) => state.customers);
  
  // Check if we have the necessary data
  const isLoading = loading === 'pending';
  const hasData = !!dashboardStats;
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main, 
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#8884d8', 
    '#82ca9d'
  ];
  
  useEffect(() => {
    // Fetch dashboard statistics
    dispatch(fetchDashboardStats())
      .unwrap()
      .catch(() => {
        // Fallback: If API fails, fetch parts and customers and calculate locally
        if (parts.length === 0) {
          dispatch(fetchParts({}));
        }
        if (customers.length === 0) {
          dispatch(fetchCustomers({}));
        }
        dispatch(calculateLocalStats());
      });
  }, [dispatch]);

  // Generate activity items from recent parts and customers
  const generateActivityItems = () => {
    if (!dashboardStats) return [];
    
    const partItems = (dashboardStats.parts.recentlyAdded || []).map(part => ({
      id: `part-${part.id}`,
      title: `New Part Added: ${part.partNumber}`,
      description: part.name,
      timestamp: part.createdAt,
      type: 'part' as const
    }));
    
    const customerItems = (dashboardStats.customers.recentlyAdded || []).map(customer => ({
      id: `customer-${customer.id}`,
      title: `New Customer Added: ${customer.name}`,
      description: customer.email,
      timestamp: customer.createdAt,
      type: 'customer' as const
    }));
    
    // Combine and sort by timestamp (newest first)
    return [...partItems, ...customerItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Prepare data for category distribution chart
  const getCategoryChartData = () => {
    if (!dashboardStats) return [];
    
    return dashboardStats.parts.categoriesDistribution.map(category => ({
      name: category.category,
      value: category.count
    }));
  };
  
  // Prepare data for customer type distribution chart
  const getCustomerTypeChartData = () => {
    if (!dashboardStats) return [];
    
    return dashboardStats.customers.byType.map(type => ({
      name: type.type,
      count: type.count
    }));
  };
  
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Parts"
            value={hasData ? dashboardStats.parts.totalParts : 0}
            icon={<InventoryIcon />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Customers"
            value={hasData ? dashboardStats.customers.totalCustomers : 0}
            icon={<PeopleIcon />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Low Stock Alerts"
            value={hasData ? dashboardStats.parts.lowStockCount : 0}
            icon={<WarningIcon />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Revenue This Month"
            value={hasData ? `$${dashboardStats.revenue.thisMonth.toLocaleString()}` : '$0'}
            icon={<PaymentsIcon />}
            trend={hasData ? {
              value: dashboardStats.revenue.percentageChange,
              isPositive: dashboardStats.revenue.percentageChange >= 0
            } : undefined}
            color={theme.palette.info.main}
          />
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12}>
          <QuickActionsCard actions={defaultQuickActions} />
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} lg={5}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" height={400} />
            </Box>
          ) : (
            <RecentActivityCard
              items={generateActivityItems()}
              emptyMessage="No recent activity"
            />
          )}
        </Grid>
        
        {/* Charts */}
        <Grid item xs={12} md={6} lg={3}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" height={300} />
            </Box>
          ) : (
            <ChartCard
              title="Parts by Category"
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCategoryChartData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {getCategoryChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              }
            />
          )}
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" height={300} />
            </Box>
          ) : (
            <ChartCard
              title="Customers by Type"
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getCustomerTypeChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={theme.palette.success.main} />
                  </BarChart>
                </ResponsiveContainer>
              }
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;