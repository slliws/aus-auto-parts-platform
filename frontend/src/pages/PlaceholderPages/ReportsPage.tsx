import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip, TextField,
  CircularProgress, Alert, IconButton, Tooltip, Grid, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api.service';
import dayjs from 'dayjs';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalPartsSold: number;
  };
  topSellingParts: Array<{
    partId: string;
    partNumber: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  revenueByCategory: Array<{ category: string; revenue: number; orders: number }>;
}

interface InventoryReport {
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
}

interface CustomerReport {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
  };
  topCustomers: Array<{
    customerId: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${Number(n ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number) => Number(n ?? 0).toLocaleString('en-AU');

const STOCK_COLORS: Record<string, 'success' | 'warning' | 'error'> = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'error',
};

// ─── Metric Card ─────────────────────────────────────────────────────────────

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}> = ({ title, value, icon, color, sub }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h5" fontWeight="bold">{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.main`, display: 'flex' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ─── Tab panel ───────────────────────────────────────────────────────────────

const TabPanel: React.FC<{ children?: React.ReactNode; index: number; value: number }> = ({ children, index, value }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState('month');
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));

  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [customerData, setCustomerData] = useState<CustomerReport | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadSales = useCallback(async () => {
    setSalesLoading(true); setSalesError(null);
    try {
      const res = await apiService.get('/analytics/reports/sales', {
        params: { startDate: dateFrom, endDate: dateTo, groupBy: period },
      });
      setSalesData(res.data?.data ?? res.data ?? null);
    } catch (e: any) {
      setSalesError(e?.response?.data?.message ?? 'Failed to load sales report');
    } finally { setSalesLoading(false); }
  }, [dateFrom, dateTo, period]);

  const loadInventory = useCallback(async () => {
    setInventoryLoading(true); setInventoryError(null);
    try {
      const res = await apiService.get('/analytics/reports/inventory');
      setInventoryData(res.data?.data ?? res.data ?? null);
    } catch (e: any) {
      setInventoryError(e?.response?.data?.message ?? 'Failed to load inventory report');
    } finally { setInventoryLoading(false); }
  }, []);

  const loadCustomers = useCallback(async () => {
    setCustomerLoading(true); setCustomerError(null);
    try {
      const res = await apiService.get('/analytics/reports/customers', {
        params: { startDate: dateFrom, endDate: dateTo },
      });
      setCustomerData(res.data?.data ?? res.data ?? null);
    } catch (e: any) {
      setCustomerError(e?.response?.data?.message ?? 'Failed to load customer report');
    } finally { setCustomerLoading(false); }
  }, [dateFrom, dateTo]);

  // Load on tab change
  useEffect(() => {
    if (tab === 0) loadSales();
    if (tab === 1) loadInventory();
    if (tab === 2) loadCustomers();
  }, [tab, loadSales, loadInventory, loadCustomers]);

  // ── CSV Export ────────────────────────────────────────────────────────────

  const exportCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const body = rows.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Reports</Typography>
            <Typography variant="body2" color="text.secondary">Business intelligence &amp; analytics</Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh current report">
          <IconButton onClick={() => { if (tab === 0) loadSales(); if (tab === 1) loadInventory(); if (tab === 2) loadCustomers(); }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Date range controls (shown on Sales + Customer tabs) */}
      {tab !== 1 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="From" type="date" size="small" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }}
          />
          <TextField
            label="To" type="date" size="small" value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }}
          />
          <FormControl size="small" sx={{ width: 130 }}>
            <InputLabel>Group by</InputLabel>
            <Select value={period} label="Group by" onChange={e => setPeriod(e.target.value)}>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" size="small" onClick={() => { if (tab === 0) loadSales(); else loadCustomers(); }}>
            Apply
          </Button>
        </Paper>
      )}

      {/* Tabs */}
      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Sales" />
          <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventory" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Customers" />
        </Tabs>

        <Box sx={{ p: 3 }}>

          {/* ── Sales Tab ─────────────────────────────────────── */}
          <TabPanel value={tab} index={0}>
            {salesLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}
            {salesError && <Alert severity="error" sx={{ mb: 2 }}>{salesError}</Alert>}
            {salesData && (
              <>
                {/* Summary cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Total Revenue" value={fmt(salesData.summary.totalRevenue)} icon={<MoneyIcon />} color="success" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Total Orders" value={num(salesData.summary.totalOrders)} icon={<TrendingUpIcon />} color="primary" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Avg Order Value" value={fmt(salesData.summary.averageOrderValue)} icon={<AssessmentIcon />} color="info" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Parts Sold" value={num(salesData.summary.totalPartsSold)} icon={<InventoryIcon />} color="warning" />
                  </Grid>
                </Grid>

                {/* Top selling parts */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Top Selling Parts</Typography>
                  <Button size="small" startIcon={<DownloadIcon />}
                    onClick={() => exportCSV(salesData.topSellingParts, `sales-report-${dateFrom}-${dateTo}.csv`)}>
                    Export CSV
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><b>Part #</b></TableCell>
                        <TableCell><b>Name</b></TableCell>
                        <TableCell><b>Category</b></TableCell>
                        <TableCell align="right"><b>Qty Sold</b></TableCell>
                        <TableCell align="right"><b>Revenue</b></TableCell>
                        <TableCell align="right"><b>Profit</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.topSellingParts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No sales data for selected period
                          </TableCell>
                        </TableRow>
                      ) : salesData.topSellingParts.map((p) => (
                        <TableRow key={p.partId} hover>
                          <TableCell><Typography variant="body2" fontFamily="monospace">{p.partNumber}</Typography></TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell><Chip label={p.category} size="small" variant="outlined" /></TableCell>
                          <TableCell align="right">{num(p.quantitySold)}</TableCell>
                          <TableCell align="right">{fmt(p.revenue)}</TableCell>
                          <TableCell align="right" sx={{ color: p.profit >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                            {fmt(p.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Revenue by category */}
                {salesData.revenueByCategory?.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Revenue by Category</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell><b>Category</b></TableCell>
                            <TableCell align="right"><b>Revenue</b></TableCell>
                            <TableCell align="right"><b>Orders</b></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesData.revenueByCategory.map((c) => (
                            <TableRow key={c.category} hover>
                              <TableCell>{c.category}</TableCell>
                              <TableCell align="right">{fmt(c.revenue)}</TableCell>
                              <TableCell align="right">{num(c.orders)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </>
            )}
          </TabPanel>

          {/* ── Inventory Tab ─────────────────────────────────── */}
          <TabPanel value={tab} index={1}>
            {inventoryLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}
            {inventoryError && <Alert severity="error" sx={{ mb: 2 }}>{inventoryError}</Alert>}
            {inventoryData && (
              <>
                {/* Summary cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Total Parts" value={num(inventoryData.summary.totalParts)} icon={<InventoryIcon />} color="primary" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Stock Value" value={fmt(inventoryData.summary.totalValue)} icon={<MoneyIcon />} color="success" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Avg Part Value" value={fmt(inventoryData.summary.averageValue)} icon={<AssessmentIcon />} color="info" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Low Stock Items" value={num(inventoryData.summary.lowStockItems)} icon={<WarningIcon />} color="warning"
                      sub={inventoryData.summary.lowStockItems > 0 ? 'Needs attention' : 'All good'} />
                  </Grid>
                </Grid>

                {/* Stock levels table */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Stock Levels</Typography>
                  <Button size="small" startIcon={<DownloadIcon />}
                    onClick={() => exportCSV(
                      (inventoryData.stockLevels ?? []).map(s => ({
                        partNumber: s.partNumber, name: s.name, category: s.category,
                        stock: s.stockQuantity, sellPrice: s.sellPrice, totalValue: s.totalValue, status: s.status,
                      })),
                      'inventory-report.csv',
                    )}>
                    Export CSV
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><b>Part #</b></TableCell>
                        <TableCell><b>Name</b></TableCell>
                        <TableCell><b>Category</b></TableCell>
                        <TableCell align="right"><b>Stock</b></TableCell>
                        <TableCell align="right"><b>Sell Price</b></TableCell>
                        <TableCell align="right"><b>Total Value</b></TableCell>
                        <TableCell><b>Status</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(inventoryData.stockLevels ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No inventory data available
                          </TableCell>
                        </TableRow>
                      ) : (inventoryData.stockLevels ?? []).map((s) => (
                        <TableRow key={s.partId} hover
                          sx={s.status === 'OUT_OF_STOCK' ? { bgcolor: 'error.light', '&:hover': { bgcolor: 'error.light' } } : undefined}>
                          <TableCell><Typography variant="body2" fontFamily="monospace">{s.partNumber}</Typography></TableCell>
                          <TableCell>{s.name}</TableCell>
                          <TableCell><Chip label={s.category} size="small" variant="outlined" /></TableCell>
                          <TableCell align="right"
                            sx={{ fontWeight: 'bold', color: s.status !== 'IN_STOCK' ? 'warning.main' : 'inherit' }}>
                            {num(s.stockQuantity)}
                          </TableCell>
                          <TableCell align="right">{fmt(s.sellPrice)}</TableCell>
                          <TableCell align="right">{fmt(s.totalValue)}</TableCell>
                          <TableCell>
                            <Chip label={s.status.replace('_', ' ')} size="small" color={STOCK_COLORS[s.status]} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

          {/* ── Customers Tab ─────────────────────────────────── */}
          <TabPanel value={tab} index={2}>
            {customerLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}
            {customerError && <Alert severity="error" sx={{ mb: 2 }}>{customerError}</Alert>}
            {customerData && (
              <>
                {/* Summary cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Total Customers" value={num(customerData.summary.totalCustomers)} icon={<PeopleIcon />} color="primary" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Active Customers" value={num(customerData.summary.activeCustomers)} icon={<PeopleIcon />} color="success" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="New Customers" value={num(customerData.summary.newCustomers)} icon={<TrendingUpIcon />} color="info"
                      sub="In selected period" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Repeat Customers" value={num(customerData.summary.repeatCustomers)} icon={<AssessmentIcon />} color="warning" />
                  </Grid>
                </Grid>

                {/* Top customers */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Top Customers by Spend</Typography>
                  <Button size="small" startIcon={<DownloadIcon />}
                    onClick={() => exportCSV(
                      (customerData.topCustomers ?? []).map(c => ({
                        name: c.name, email: c.email, totalOrders: c.totalOrders,
                        totalSpent: c.totalSpent, averageOrderValue: c.averageOrderValue,
                        lastOrderDate: c.lastOrderDate,
                      })),
                      `customer-report-${dateFrom}-${dateTo}.csv`,
                    )}>
                    Export CSV
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><b>Name</b></TableCell>
                        <TableCell><b>Email</b></TableCell>
                        <TableCell align="right"><b>Orders</b></TableCell>
                        <TableCell align="right"><b>Total Spent</b></TableCell>
                        <TableCell align="right"><b>Avg Order</b></TableCell>
                        <TableCell><b>Last Order</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(customerData.topCustomers ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No customer data for selected period
                          </TableCell>
                        </TableRow>
                      ) : (customerData.topCustomers ?? []).map((c) => (
                        <TableRow key={c.customerId} hover>
                          <TableCell><Typography variant="body2" fontWeight="medium">{c.name}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{c.email}</Typography></TableCell>
                          <TableCell align="right">{num(c.totalOrders)}</TableCell>
                          <TableCell align="right"><b>{fmt(c.totalSpent)}</b></TableCell>
                          <TableCell align="right">{fmt(c.averageOrderValue)}</TableCell>
                          <TableCell>
                            {c.lastOrderDate ? dayjs(c.lastOrderDate).format('DD/MM/YYYY') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>

        </Box>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
