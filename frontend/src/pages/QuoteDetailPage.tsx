import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Snackbar, Stack, GlobalStyles
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Send as SendIcon,
  ShoppingCart as OrderIcon,
  RequestQuote as QuoteIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  CheckCircle as AcceptIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { selectAuthUser } from '../store/slices/authSlice';
import apiService from '../services/api.service';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  part: {
    id: string;
    part_number: string;
    name: string;
    description?: string;
    condition: string;
  };
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  subtotal_amount: number;
  gst_amount: number;
  total_amount: number;
  notes?: string;
  internal_notes?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company_name?: string;
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  quote_items: QuoteItem[];
  _count?: {
    quote_items: number;
  };
}

// ─── Colour maps ────────────────────────────────────────────────────────────

const QUOTE_STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  DRAFT: 'default',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
};

const CONDITION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  NEW: 'success',
  USED_EXCELLENT: 'success',
  USED_GOOD: 'warning',
  USED_FAIR: 'warning',
  DAMAGED: 'error',
  CORE: 'default',
};

const QUOTE_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number | string) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

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

const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => selectAuthUser(state));
  const canManageQuote = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Status change dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');

  // Send dialog
  const [sendDialog, setSendDialog] = useState(false);

  // Convert to order dialog
  const [convertDialog, setConvertDialog] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const res = await apiService.get(`/quotes/${id}`);
      const q: Quote = res.data?.data?.quote ?? res.data?.data ?? res.data;
      setQuote(q);
      setPendingStatus(q.status);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusSave = async () => {
    if (!quote || pendingStatus === quote.status) { setStatusDialog(false); return; }
    setSaving(true);
    try {
      await apiService.patch(`/quotes/${quote.id}`, { status: pendingStatus });
      setToast(`Quote status updated to ${pendingStatus}`);
      setStatusDialog(false);
      await load();
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!quote) return;
    setSaving(true);
    try {
      await apiService.post(`/quotes/${quote.id}/send`);
      setToast('Quote sent — status updated to SENT');
      setSendDialog(false);
      await load();
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to send quote');
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!quote) return;
    setSaving(true);
    try {
      const res = await apiService.post(`/quotes/${quote.id}/convert`);
      const orderId = res.data?.data?.order?.id ?? res.data?.data?.id ?? null;
      setToast('Quote converted to order!');
      setConvertDialog(false);
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to convert quote to order');
      setConvertDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    setSaving(true);
    try {
      await apiService.delete(`/quotes/${quote.id}`);
      setToast('Quote deleted');
      setDeleteDialog(false);
      navigate('/quotes');
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to delete quote');
      setDeleteDialog(false);
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

  if (!quote) return null;


  // ── Print styles ──────────────────────────────────────────────────────────
  const printStyles = (
    <GlobalStyles styles={{
      '@media print': {
        'header, nav, .MuiAppBar-root, .MuiDrawer-root': { display: 'none !important' },
        '.MuiToolbar-root': { display: 'none !important' },
        '#print-hide': { display: 'none !important' },
        body: { margin: 0 },
      }
    }} />
  );

  const expired = isExpired(quote.expires_at);
  const isDraft = quote.status === 'DRAFT';
  const isSent = quote.status === 'SENT';
  const isAccepted = quote.status === 'ACCEPTED';
  const isFinal = ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(quote.status);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {printStyles}
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/quotes')} size="small"><BackIcon /></IconButton>
          <QuoteIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold" fontFamily="monospace">
              {quote.quote_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {fmtDate(quote.created_at)}
            </Typography>
          </Box>
          <Chip
            label={quote.status}
            color={QUOTE_STATUS_COLORS[quote.status] ?? 'default'}
            sx={{ ml: 1 }}
          />
          {expired && quote.status !== 'EXPIRED' && (
            <Chip label="PAST EXPIRY" size="small" color="warning" variant="outlined" />
          )}
        </Box>
        <Stack id="print-hide" direction="row" spacing={1}>
          <Tooltip title="Refresh"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
          <Tooltip title="Print"><IconButton onClick={() => window.print()}><PrintIcon /></IconButton></Tooltip>
          {isDraft && (
            <Button
              variant="outlined"
              color="info"
              startIcon={<SendIcon />}
              onClick={() => setSendDialog(true)}
            >
              Send
            </Button>
          )}
          {isAccepted && canManageQuote && (
            <Button
              variant="contained"
              color="success"
              startIcon={<OrderIcon />}
              onClick={() => setConvertDialog(true)}
            >
              Convert to Order
            </Button>
          )}
          {!isFinal && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setStatusDialog(true)}
            >
              Update Status
            </Button>
          )}
          {(isDraft || isSent) && canManageQuote && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialog(true)}
            >
              Delete
            </Button>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {/* ── Left column ── */}
        <Grid item xs={12} md={8}>
          {/* Quote Items */}
          <Section title="Quote Items" icon={<InventoryIcon />}>
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
                  {quote.quote_items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No items on this quote
                      </TableCell>
                    </TableRow>
                  ) : quote.quote_items.map(item => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {item.part.part_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.part.name}</Typography>
                        {item.part.description && (
                          <Typography variant="caption" color="text.secondary">{item.part.description}</Typography>
                        )}
                        {item.notes && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Note: {item.notes}
                          </Typography>
                        )}
                      </TableCell>
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
                  <Typography variant="body2">{fmt(quote.subtotal_amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">GST (10%)</Typography>
                  <Typography variant="body2">{fmt(quote.gst_amount)}</Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body1" fontWeight="bold">Total (inc. GST)</Typography>
                  <Typography variant="body1" fontWeight="bold">{fmt(quote.total_amount)}</Typography>
                </Box>
              </Box>
            </Box>
          </Section>

          {/* Notes */}
          {(quote.notes || quote.internal_notes) && (
            <Section title="Notes" icon={<EditIcon />}>
              {quote.notes && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">CUSTOMER NOTES</Typography>
                  <Typography variant="body2">{quote.notes}</Typography>
                </Box>
              )}
              {quote.internal_notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">INTERNAL NOTES</Typography>
                  <Typography variant="body2">{quote.internal_notes}</Typography>
                </Box>
              )}
            </Section>
          )}
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} md={4}>
          {/* Customer */}
          <Section title="Customer" icon={<PersonIcon />}>
            {quote.customer ? (
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {quote.customer.first_name} {quote.customer.last_name}
                </Typography>
                {quote.customer.company_name && (
                  <Typography variant="body2" color="text.secondary">{quote.customer.company_name}</Typography>
                )}
                <Typography variant="body2" color="text.secondary">{quote.customer.email}</Typography>
                {quote.customer.phone && (
                  <Typography variant="body2" color="text.secondary">{quote.customer.phone}</Typography>
                )}
                <Button
                  size="small"
                  variant="text"
                  sx={{ mt: 1, px: 0 }}
                  onClick={() => navigate(`/customers/${quote.customer?.id}`)}
                >
                  View customer →
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No customer linked</Typography>
            )}
          </Section>

          {/* Quote info */}
          <Section title="Quote Info" icon={<QuoteIcon />}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">QUOTE NUMBER</Typography>
                <Typography variant="body2" fontFamily="monospace" fontWeight="bold">{quote.quote_number}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">STATUS</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={quote.status}
                    size="small"
                    color={QUOTE_STATUS_COLORS[quote.status] ?? 'default'}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">EXPIRES</Typography>
                <Typography
                  variant="body2"
                  color={expired && !isFinal ? 'error.main' : 'text.primary'}
                  fontWeight={expired && !isFinal ? 'bold' : 'normal'}
                >
                  {fmtDateShort(quote.expires_at)}
                  {expired && !isFinal && ' ⚠ Expired'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ITEMS</Typography>
                <Typography variant="body2">{quote.quote_items.length} line item{quote.quote_items.length !== 1 ? 's' : ''}</Typography>
              </Box>
              {quote.user && (
                <Box>
                  <Typography variant="caption" color="text.secondary">CREATED BY</Typography>
                  <Typography variant="body2">{quote.user.first_name} {quote.user.last_name}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">CREATED</Typography>
                <Typography variant="body2">{fmtDate(quote.created_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">LAST UPDATED</Typography>
                <Typography variant="body2">{fmtDate(quote.updated_at)}</Typography>
              </Box>
            </Stack>
          </Section>

          {/* Quick actions callout for accepted quotes */}
          {isAccepted && canManageQuote && (
            <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AcceptIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" color="success.dark" fontWeight="bold">
                  Ready to Convert
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                This quote has been accepted. Convert it to an order to begin fulfilment.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<OrderIcon />}
                onClick={() => setConvertDialog(true)}
              >
                Convert to Order
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* ── Status update dialog ── */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Quote Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>New Status</InputLabel>
              <Select value={pendingStatus} label="New Status" onChange={e => setPendingStatus(e.target.value)}>
                {QUOTE_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>
                    <Chip label={s} size="small" color={QUOTE_STATUS_COLORS[s] ?? 'default'} sx={{ mr: 1 }} />
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
            disabled={saving || pendingStatus === quote.status}
          >
            {saving ? <CircularProgress size={16} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Send quote dialog ── */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)}>
        <DialogTitle>Send Quote?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Mark <strong>{quote.quote_number}</strong> as SENT?
            {quote.customer && (
              <> This will record the quote as having been sent to{' '}
                <strong>{quote.customer.first_name} {quote.customer.last_name}</strong>.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleSend}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <SendIcon />}
          >
            Send Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Convert to order dialog ── */}
      <Dialog open={convertDialog} onClose={() => setConvertDialog(false)}>
        <DialogTitle>Convert to Order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Convert <strong>{quote.quote_number}</strong> to a new order?
            The quote items and customer will be copied to the new order and you'll be taken to the order page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConvert}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <OrderIcon />}
          >
            {saving ? 'Converting…' : 'Convert to Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Quote?</DialogTitle>
        <DialogContent>
          {isSent && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This quote has already been sent to the customer. Deleting it will not recall the quote
              — the customer may still have their copy.
            </Alert>
          )}
          <DialogContentText>
            Delete <strong>{quote.quote_number}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Go Back</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? <CircularProgress size={16} /> : 'Delete Quote'}
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

export default QuoteDetailPage;
