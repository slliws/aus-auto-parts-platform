import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, TextField, InputAdornment,
  CircularProgress, Alert, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Search as SearchIcon, RequestQuote as QuoteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import apiService from '../../services/api.service';

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
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiService.get('/quotes', { params: { page: 1, limit: 50 } });
      setQuotes(res.data?.data?.quotes ?? res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load quotes');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = quotes.filter(q => {
    const matchSearch = [q.quote_number, q.customer?.first_name, q.customer?.last_name, q.customer?.company_name]
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const accepted = quotes.filter(q => q.status === 'ACCEPTED');
  const totalAccepted = accepted.reduce((s, q) => s + Number(q.total_amount), 0);
  const conversionRate = quotes.length ? Math.round((accepted.length / quotes.length) * 100) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuoteIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Quotes</Typography>
            <Typography variant="body2" color="text.secondary">
              {quotes.length} quotes · {conversionRate}% conversion · ${totalAccepted.toFixed(2)} accepted
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<QuoteIcon />}>New Quote</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          placeholder="Search quote number, customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          size="small" sx={{ width: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {['DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED'].map(s => (
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
                <TableCell><b>Quote #</b></TableCell>
                <TableCell><b>Customer</b></TableCell>
                <TableCell><b>Items</b></TableCell>
                <TableCell align="right"><b>Subtotal</b></TableCell>
                <TableCell align="right"><b>GST</b></TableCell>
                <TableCell align="right"><b>Total (inc. GST)</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Expires</b></TableCell>
                <TableCell><b>Created</b></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <QuoteIcon sx={{ fontSize: 48, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
                  <Typography color="text.secondary">No quotes found</Typography>
                </TableCell></TableRow>
              ) : filtered.map(q => (
                <TableRow key={q.id} hover>
                  <TableCell><Typography variant="body2" fontFamily="monospace" fontWeight="bold">{q.quote_number}</Typography></TableCell>
                  <TableCell>
                    {q.customer ? (
                      <>
                        <Typography variant="body2">{q.customer.first_name} {q.customer.last_name}</Typography>
                        {q.customer.company_name && <Typography variant="caption" color="text.secondary">{q.customer.company_name}</Typography>}
                      </>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{q.quote_items?.length ?? '—'}</TableCell>
                  <TableCell align="right">${Number(q.subtotal_amount).toFixed(2)}</TableCell>
                  <TableCell align="right">${Number(q.gst_amount).toFixed(2)}</TableCell>
                  <TableCell align="right"><b>${Number(q.total_amount).toFixed(2)}</b></TableCell>
                  <TableCell><Chip label={q.status} size="small" color={STATUS_COLORS[q.status] ?? 'default'} /></TableCell>
                  <TableCell>{new Date(q.expires_at).toLocaleDateString('en-AU')}</TableCell>
                  <TableCell>{new Date(q.created_at).toLocaleDateString('en-AU')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" variant="outlined">View</Button>
                      {q.status === 'ACCEPTED' && <Button size="small" variant="contained" color="success">→ Order</Button>}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default QuotesPage;
