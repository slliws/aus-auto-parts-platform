import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Snackbar, Stack
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  ShoppingCart as OrderIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { selectAuthUser } from '../store/slices/authSlice';
import apiService from '../services/api.service';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  part: {
    id: string;
    part_number: string;
    name: string;
    condition: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  payment_date: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal_amount: number;
  gst_amount: number;
  total_amount: number;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  order_items: OrderItem[];
  payments: Payment[];
  quote?: {
    id: string;
    quote_number: string;
  };
  _count?: {
    order_items: number;
    payments: number;
    shipments: number;
  };
}

// ─── Colour maps ────────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  PENDING: 'warning',
  PICKING: 'info',
  PACKED: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const PAYMENT_STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'error',
  REFUNDED: 'default',
  PARTIALLY_REFUNDED: 'warning',
  CANCELLED: 'default',
};

const CONDITION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  NEW: 'success',
  USED_EXCELLENT: 'success',
  USED_GOOD: 'warning',
  USED_FAIR: 'warning',
  DAMAGED: 'error',
  CORE: 'default',
};

const ORDER_STATUSES = ['PENDING', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number | string) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d: string) => new Date(d).toLocaleString('en-AU', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

// ─── Section card ────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <Paper sx={{ p: 2.5, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
    </Box>
    {children}
  </Paper>
);

// ─── Main component ───────────────────────────────────────────────────────────

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => selectAuthUser(state));
  const canManageOrder = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Status change dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');

  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await apiService.get(`/orders/${id}`);
      const o: Order = res.data?.data?.order ?? res.data?.data ?? res.data;
      setOrder(o);
      setPendingStatus(o.status);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusSave = async () => {
    if (!order || pendingStatus === order.status) { setStatusDialog(false); return; }
    setSaving(true);
    try {
      await apiService.patch(`/orders/${order.id}`, { status: pendingStatus });
      setToast(`Order status updated to ${pendingStatus}`);
      setStatusDialog(false);
      await load();
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await apiService.post(`/orders/${order.id}/cancel`);
      setToast('Order cancelled');
      setCancelDialog(false);
      await load();
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to cancel order');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>{error}</Alert>
      </Box>
    );
  }

  if (!order) return null;

  const isCancelled = order.status === 'CANCELLED';
  // Use integer cent arithmetic to avoid floating-point accumulation errors
  const totalPaidCents = order.payments
    .filter(p => p.payment_status === 'COMPLETED')
    .reduce((s, p) => s + Math.round(Number(p.amount) * 100), 0);
  const totalPaid = totalPaidCents / 100;
  const outstandingCents = Math.round(Number(order.total_amount) * 100) - totalPaidCents;
  const outstanding = outstandingCents / 100;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/orders')} size="small"><BackIcon /></IconButton>
          <OrderIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" fontFamily="monospace">
              {order.order_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {fmtDate(order.created_at)}
            </Typography>
          </Box>
          <Chip
            label={order.status}
            color={ORDER_STATUS_COLORS[order.status] ?? 'default'}
            sx={{ ml: 1 }}
          />
          <Chip
            label={order.payment_status}
            color={PAYMENT_STATUS_COLORS[order.payment_status] ?? 'default'}
            variant="outlined"
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
          <Tooltip title="Print"><IconButton onClick={() => window.print()}><PrintIcon /></IconButton></Tooltip>
          {!isCancelled && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setStatusDialog(true)}
              >
                Update Status
              </Button>
              {canManageOrder && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelDialog(true)}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {/* ── Left column ── */}
        <Grid item xs={12} md={8}>
          {/* Order Items */}
          <Section title="Order Items" icon={<InventoryIcon />}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Part #</b></TableCell>
                    <TableCell><b>Description</b></TableCell>
                    <TableCell><b>Condition</b></TableCell>
                    <TableCell align="center"><b>Qty</b></TableCell>
                    <TableCell align="right"><b>Unit Price</b></TableCell>
                    <TableCell align="right"><b>Total</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.order_items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No items
                      </TableCell>
                    </TableRow>
                  ) : order.order_items.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {item.part.part_number}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.part.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.part.condition.replace('USED_', '')}
                          size="small"
                          color={CONDITION_COLORS[item.part.condition] ?? 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{fmt(item.unit_price)}</TableCell>
                      <TableCell align="right"><b>{fmt(item.total_price)}</b></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: 260 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">{fmt(order.subtotal_amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">GST (10%)</Typography>
                  <Typography variant="body2">{fmt(order.gst_amount)}</Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body1" fontWeight="bold">Total (inc. GST)</Typography>
                  <Typography variant="body1" fontWeight="bold">{fmt(order.total_amount)}</Typography>
                </Box>
                {totalPaid > 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="success.main">Paid</Typography>
                      <Typography variant="body2" color="success.main">- {fmt(totalPaid)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color={outstanding > 0 ? 'error.main' : 'text.secondary'}>
                        {outstanding > 0 ? 'Outstanding' : 'Fully Paid'}
                      </Typography>
                      <Typography variant="body2" color={outstanding > 0 ? 'error.main' : 'text.secondary'}>
                        {fmt(outstanding)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Section>

          {/* Payments */}
          <Section title="Payments" icon={<PaymentIcon />}>
            {order.payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No payments recorded</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><b>Payment ID</b></TableCell>
                      <TableCell align="right"><b>Amount</b></TableCell>
                      <TableCell><b>Status</b></TableCell>
                      <TableCell><b>Date</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.payments.map(p => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">{p.id.slice(0, 8)}…</Typography>
                        </TableCell>
                        <TableCell align="right">{fmt(p.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.payment_status}
                            size="small"
                            color={PAYMENT_STATUS_COLORS[p.payment_status] ?? 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {p.payment_date ? fmtDate(p.payment_date) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Section>

          {/* Notes */}
          {(order.notes || order.internal_notes) && (
            <Section title="Notes" icon={<EditIcon />}>
              {order.notes && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">CUSTOMER NOTES</Typography>
                  <Typography variant="body2">{order.notes}</Typography>
                </Box>
              )}
              {order.internal_notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">INTERNAL NOTES</Typography>
                  <Typography variant="body2">{order.internal_notes}</Typography>
                </Box>
              )}
            </Section>
          )}
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} md={4}>
          {/* Customer */}
          <Section title="Customer" icon={<PersonIcon />}>
            {order.customer ? (
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {order.customer.first_name} {order.customer.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">{order.customer.email}</Typography>
                {order.customer.phone && (
                  <Typography variant="body2" color="text.secondary">{order.customer.phone}</Typography>
                )}
                <Button
                  size="small"
                  variant="text"
                  sx={{ mt: 1, px: 0 }}
                  onClick={() => navigate(`/customers/${order.customer?.id}`)}
                >
                  View customer →
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No customer linked</Typography>
            )}
          </Section>

          {/* Order info */}
          <Section title="Order Info" icon={<OrderIcon />}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">ORDER NUMBER</Typography>
                <Typography variant="body2" fontFamily="monospace" fontWeight="bold">{order.order_number}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">STATUS</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={order.status} size="small" color={ORDER_STATUS_COLORS[order.status] ?? 'default'} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">PAYMENT</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={order.payment_status} size="small" color={PAYMENT_STATUS_COLORS[order.payment_status] ?? 'default'} variant="outlined" />
                </Box>
              </Box>
              {order.quote && (
                <Box>
                  <Typography variant="caption" color="text.secondary">FROM QUOTE</Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ px: 0, display: 'block' }}
                    onClick={() => navigate(`/quotes/${order.quote?.id}`)}
                  >
                    {order.quote.quote_number}
                  </Button>
                </Box>
              )}
              {order.user && (
                <Box>
                  <Typography variant="caption" color="text.secondary">CREATED BY</Typography>
                  <Typography variant="body2">{order.user.first_name} {order.user.last_name}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">CREATED</Typography>
                <Typography variant="body2">{fmtDate(order.created_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">LAST UPDATED</Typography>
                <Typography variant="body2">{fmtDate(order.updated_at)}</Typography>
              </Box>
              {order._count && (
                <Box>
                  <Typography variant="caption" color="text.secondary">SHIPMENTS</Typography>
                  <Typography variant="body2">{order._count.shipments}</Typography>
                </Box>
              )}
            </Stack>
          </Section>
        </Grid>
      </Grid>

      {/* ── Status update dialog ── */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>New Status</InputLabel>
              <Select value={pendingStatus} label="New Status" onChange={e => setPendingStatus(e.target.value)}>
                {ORDER_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>
                    <Chip label={s} size="small" color={ORDER_STATUS_COLORS[s] ?? 'default'} sx={{ mr: 1 }} />
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStatusSave}
            disabled={saving || pendingStatus === order.status}
          >
            {saving ? <CircularProgress size={16} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel confirmation dialog ── */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Cancel Order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cancel order <strong>{order.order_number}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Go Back</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={saving}
          >
            {saving ? <CircularProgress size={16} /> : 'Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ── */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default OrderDetailPage;
