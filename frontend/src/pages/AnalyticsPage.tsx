import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Skeleton,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  People,
  ShoppingCart,
  Analytics,
  Download,
  DateRange,
  Refresh,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { apiService } from '../services/api.service';

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

interface DashboardMetrics {
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

// Components
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color
}) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color, fontSize: 48 }}>
            {icon}
          </Box>
          {change !== undefined && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="body2"
                sx={{
                  color: change >= 0 ? theme.palette.success.main : theme.palette.error.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {change >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                {Math.abs(change).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {changeLabel || 'vs last period'}
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Main Component
const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);

  // Date range filters
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
  ];

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get('/analytics/dashboard');
      setDashboardMetrics(response.data.metrics);
    } catch (err: any) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getRevenueChartData = () => {
    if (!dashboardMetrics) return [];

    return [
      { name: 'Today', revenue: dashboardMetrics.revenue.today },
      { name: 'This Week', revenue: dashboardMetrics.revenue.thisWeek },
      { name: 'This Month', revenue: dashboardMetrics.revenue.thisMonth },
      { name: 'This Year', revenue: dashboardMetrics.revenue.thisYear },
    ];
  };

  const getInventoryStatusData = () => {
    if (!dashboardMetrics) return [];

    return [
      { name: 'In Stock', value: dashboardMetrics.inventory.totalParts - dashboardMetrics.inventory.lowStockItems - dashboardMetrics.inventory.outOfStockItems, color: theme.palette.success.main },
      { name: 'Low Stock', value: dashboardMetrics.inventory.lowStockItems, color: theme.palette.warning.main },
      { name: 'Out of Stock', value: dashboardMetrics.inventory.outOfStockItems, color: theme.palette.error.main },
    ];
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={12} md={6} lg={3} key={i}>
              <Skeleton variant="rectangular" height={140} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error || !dashboardMetrics) {
      return (
        <Alert severity="error">
          {error || 'Failed to load dashboard data'}
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* Revenue Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(dashboardMetrics.revenue.total)}
            change={dashboardMetrics.revenue.growth.monthly}
            changeLabel="vs last month"
            icon={<Analytics />}
            color={theme.palette.primary.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Monthly Revenue"
            value={formatCurrency(dashboardMetrics.revenue.thisMonth)}
            change={dashboardMetrics.revenue.growth.monthly}
            changeLabel="vs last month"
            icon={<TrendingUp />}
            color={theme.palette.success.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Orders"
            value={dashboardMetrics.sales.totalOrders}
            change={dashboardMetrics.revenue.growth.monthly}
            changeLabel="vs last month"
            icon={<ShoppingCart />}
            color={theme.palette.info.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(dashboardMetrics.sales.averageOrderValue)}
            icon={<Analytics />}
            color={theme.palette.warning.main}
          />
        </Grid>

        {/* Charts Row 1 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getRevenueChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.light}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getInventoryStatusData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getInventoryStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Customers"
            value={dashboardMetrics.customers.total}
            icon={<People />}
            color={theme.palette.secondary.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="New This Month"
            value={dashboardMetrics.customers.newThisMonth}
            icon={<People />}
            color={theme.palette.success.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Active Customers"
            value={dashboardMetrics.customers.active}
            icon={<People />}
            color={theme.palette.info.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Retention Rate"
            value={formatPercentage(dashboardMetrics.customers.retention)}
            icon={<Analytics />}
            color={theme.palette.warning.main}
          />
        </Grid>

        {/* Inventory Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Parts"
            value={dashboardMetrics.inventory.totalParts}
            icon={<Inventory />}
            color={theme.palette.primary.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Low Stock Items"
            value={dashboardMetrics.inventory.lowStockItems}
            icon={<Inventory />}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Out of Stock"
            value={dashboardMetrics.inventory.outOfStockItems}
            icon={<Inventory />}
            color={theme.palette.error.main}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="High Value Items"
            value={dashboardMetrics.inventory.highValueItems}
            icon={<Inventory />}
            color={theme.palette.success.main}
          />
        </Grid>
      </Grid>
    );
  };

  const renderSalesReports = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Start Date"
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End Date"
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <Button variant="contained" startIcon={<Download />}>
          Export Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardMetrics && (
                      <>
                        <TableRow>
                          <TableCell>Total Revenue</TableCell>
                          <TableCell align="right">{formatCurrency(dashboardMetrics.revenue.total)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${dashboardMetrics.revenue.growth.monthly > 0 ? '+' : ''}${dashboardMetrics.revenue.growth.monthly.toFixed(1)}%`}
                              color={dashboardMetrics.revenue.growth.monthly >= 0 ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Orders</TableCell>
                          <TableCell align="right">{dashboardMetrics.sales.totalOrders}</TableCell>
                          <TableCell align="right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Average Order Value</TableCell>
                          <TableCell align="right">{formatCurrency(dashboardMetrics.sales.averageOrderValue)}</TableCell>
                          <TableCell align="right">-</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderInventoryReports = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inventory Analytics
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Detailed inventory reports and forecasting features coming soon.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCustomerReports = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Analytics
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Advanced customer analytics and segmentation features coming soon.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Analytics & Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDashboardMetrics} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Dashboard" />
          <Tab label="Sales Reports" />
          <Tab label="Inventory Reports" />
          <Tab label="Customer Reports" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderDashboard()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderSalesReports()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderInventoryReports()}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {renderCustomerReports()}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnalyticsPage;