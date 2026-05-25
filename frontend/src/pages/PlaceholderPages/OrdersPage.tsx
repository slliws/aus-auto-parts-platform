import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, TextField, InputAdornment,
  CircularProgress, Alert, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Search as SearchIcon, ShoppingCart as OrderIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import apiService from '../../services/api.service';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  gst_amount: number;
  subtotal_amount: number;
  created_at: string;
  customer?: { first_name: string; last_name: string; company_name?: string };
  order_items?: any[];
}

const STATUS_COLORS: Record<string, any> = {
  PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info',
  SHIPPED: 'primary', DELIVERED: 'success', CANCELLED: 'error',
};
const PAYMENT_COLORS: Record<string, any> = {
  PENDING: 'warning', PAID: 'success', REFUNDED: 'default', FAILED: 'error',
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiService.get('/orders', { params: { page: 1, limit: 50 } });
      setOrders(res.data?.data?.orders ?? res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load orders');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = [o.order_number, o.customer?.first_name, o.customer?.last_name, o.customer?.company_name]
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.filter(o => o.payment_status === 'PAID').reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OrderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Orders</Typography>
            <Typography variant="body2" color="text.secondary">
              {orders.length} orders · ${totalRevenue.toFixed(2)} collected
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<OrderIcon />}>New Order</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          placeholder="Search order number, customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          size="small" sx={{ width: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Order #</b></TableCell>
                <TableCell><b>Customer</b></TableCell>
                <TableCell><b>Items</b></TableCell>
                <TableCell align="right"><b>Subtotal</b></TableCell>
                <TableCell align="right"><b>GST</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Payment</b></TableCell>
                <TableCell><b>Date</b></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <OrderIcon sx={{ fontSize: 48, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
                  <Typography color="text.secondary">No orders found</Typography>
                </TableCell></TableRow>
              ) : filtered.map(o => (
                <TableRow key={o.id} hover>
                  <TableCell><Typography variant="body2" fontFamily="monospace" fontWeight="bold">{o.order_number}</Typography></TableCell>
                  <TableCell>
                    {o.customer ? (
                      <>
                        <Typography variant="body2">{o.customer.first_name} {o.customer.last_name}</Typography>
                        {o.customer.company_name && <Typography variant="caption" color="text.secondary">{o.customer.company_name}</Typography>}
                      </>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{o.order_items?.length ?? '—'}</TableCell>
                  <TableCell align="right">${Number(o.subtotal_amount).toFixed(2)}</TableCell>
                  <TableCell align="right">${Number(o.gst_amount).toFixed(2)}</TableCell>
                  <TableCell align="right"><b>${Number(o.total_amount).toFixed(2)}</b></TableCell>
                  <TableCell><Chip label={o.status} size="small" color={STATUS_COLORS[o.status] ?? 'default'} /></TableCell>
                  <TableCell><Chip label={o.payment_status} size="small" color={PAYMENT_COLORS[o.payment_status] ?? 'default'} variant="outlined" /></TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString('en-AU')}</TableCell>
                  <TableCell><Button size="small" variant="outlined" onClick={() => navigate(`/orders/${o.id}`)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default OrdersPage;
