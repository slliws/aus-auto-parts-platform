import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, TextField, InputAdornment,
  CircularProgress, Alert, IconButton, Tooltip, Select, MenuItem,
  FormControl, InputLabel, TablePagination
} from '@mui/material';
import { Search as SearchIcon, RequestQuote as QuoteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import apiService from '../services/api.service';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectAuthUser } from '../store/slices/authSlice';

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  gst_amount: number;
  subtotal_amount: number;
  expires_at: string;
  created_at: string;
  customer?: { first_name: string; last_name: string; company_name?: string };
  quote_items?: any[];
}

const STATUS_COLORS: Record<string, any> = {
  DRAFT: 'default', SENT: 'info', ACCEPTED: 'success', REJECTED: 'error', EXPIRED: 'warning',
};

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => selectAuthUser(state));
  const isAdminOrManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter (server-side)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [statusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const res = await apiService.get('/quotes', { params });
      const data = res.data?.data;
      setQuotes(data?.quotes ?? data ?? []);
      setTotal(data?.total ?? data?.pagination?.total ?? (data?.quotes ?? data ?? []).length);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Integer-safe accepted total (avoid float accumulation)
  const acceptedQuotes = quotes.filter(q => q.status === 'ACCEPTED');
  const totalAcceptedCents = acceptedQuotes.reduce(
    (s, q) => s + Math.round(Number(q.total_amount) * 100),
    0,
  );
  const totalAccepted = (totalAcceptedCents / 100).toFixed(2);
  const conversionRate = quotes.length
    ? Math.round((acceptedQuotes.length / quotes.length) * 100)
    : 0;

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuoteIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Quotes</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} quotes · {conversionRate}% conversion (this page) · ${totalAccepted} accepted
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={load}><RefreshIcon /></IconButton>
          </Tooltip>
          {isAdminOrManager && (
            <Button
              variant="contained"
              startIcon={<QuoteIcon />}
              onClick={() => navigate('/quotes/new')}
            >
              New Quote
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search quote number, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 320 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />
        <FormControl size="small" sx={{ width: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={e => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Quote #</b></TableCell>
                <TableCell><b>Customer</b></TableCell>
                <TableCell><b>Items</b></TableCell>
                <TableCell align="right"><b>Subtotal</b></TableCell>
                <TableCell align="right"><b>GST</b></TableCell>
                <TableCell align="right"><b>Total (inc. GST)</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Expires</b></TableCell>
                <TableCell><b>Created</b></TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <QuoteIcon sx={{ fontSize: 48, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography color="text.secondary">No quotes found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map(q => {
                  const expired = isExpired(q.expires_at);
                  return (
                    <TableRow key={q.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {q.quote_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {q.customer ? (
                          <>
                            <Typography variant="body2">
                              {q.customer.first_name} {q.customer.last_name}
                            </Typography>
                            {q.customer.company_name && (
                              <Typography variant="caption" color="text.secondary">
                                {q.customer.company_name}
                              </Typography>
                            )}
                          </>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{q.quote_items?.length ?? '—'}</TableCell>
                      <TableCell align="right">${Number(q.subtotal_amount).toFixed(2)}</TableCell>
                      <TableCell align="right">${Number(q.gst_amount).toFixed(2)}</TableCell>
                      <TableCell align="right"><b>${Number(q.total_amount).toFixed(2)}</b></TableCell>
                      <TableCell>
                        <Chip label={q.status} size="small" color={STATUS_COLORS[q.status] ?? 'default'} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={expired && q.status !== 'ACCEPTED' ? 'error.main' : 'text.primary'}
                        >
                          {new Date(q.expires_at).toLocaleDateString('en-AU')}
                          {expired && q.status !== 'ACCEPTED' && ' ⚠'}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(q.created_at).toLocaleDateString('en-AU')}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/quotes/${q.id}`)}
                          >
                            View
                          </Button>
                          {q.status === 'ACCEPTED' && isAdminOrManager && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => navigate(`/quotes/${q.id}`)}
                              title="Open quote to convert to order"
                            >
                              → Order
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Server-side pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Rows:"
        />
      </Paper>
    </Box>
  );
};

export default QuotesPage;
