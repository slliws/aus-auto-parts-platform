import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, TextField, InputAdornment,
  CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon, DirectionsCar as CarIcon,
  Refresh as RefreshIcon, Build as BuildIcon,
  Visibility as ViewIcon, Add as AddIcon
} from '@mui/icons-material';
import { fetchVehicles as getVehicles, Vehicle } from '../services/vehicle.service';
import VehicleFormDialog from '../components/organisms/vehicles/VehicleFormDialog';

const statusColor: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  INTAKE: 'warning',
  DISMANTLING: 'info',
  COMPLETE: 'success',
  SOLD: 'default',
};

const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [intakeOpen, setIntakeOpen] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getVehicles({}, { page: 1, limit: 50 });
      setVehicles(res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load vehicles');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleIntakeClose = (created: boolean) => {
    setIntakeOpen(false);
    if (created) load();
  };

  const filtered = vehicles.filter(v =>
    [v.make, v.model, String(v.year), v.vin, v.registration_number].join(' ')
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CarIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Vehicles</Typography>
            <Typography variant="body2" color="text.secondary">{vehicles.length} vehicles in yard</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={load}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIntakeOpen(true)}>
            Intake Vehicle
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        placeholder="Search by make, model, year, VIN, rego..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: 380 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
        }}
      />

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Vehicle</b></TableCell>
                <TableCell><b>VIN</b></TableCell>
                <TableCell><b>Rego</b></TableCell>
                <TableCell><b>Transmission</b></TableCell>
                <TableCell><b>Fuel</b></TableCell>
                <TableCell><b>Parts</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Date In</b></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CarIcon sx={{ fontSize: 48, color: 'grey.300', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography color="text.secondary">No vehicles found</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setIntakeOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      Intake First Vehicle
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filtered.map(v => (
                <TableRow key={v.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/vehicles/${v.id}`)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{v.year} {v.make} {v.model}</Typography>
                    {v.color && <Typography variant="caption" color="text.secondary">{v.color}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">{v.vin || '—'}</Typography>
                  </TableCell>
                  <TableCell>{v.registration_number || '—'}</TableCell>
                  <TableCell>{v.transmission || '—'}</TableCell>
                  <TableCell>{v.fuel_type || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${v._count?.parts ?? 0} parts`}
                      size="small"
                      icon={<BuildIcon />}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Chip
                      label={(v as any).status ?? 'INTAKE'}
                      size="small"
                      color={statusColor[(v as any).status ?? 'INTAKE'] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {v.date_received ? new Date(v.date_received).toLocaleDateString('en-AU') : '—'}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/vehicles/${v.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Intake vehicle dialog */}
      <VehicleFormDialog open={intakeOpen} onClose={handleIntakeClose} vehicle={null} />
    </Box>
  );
};

export default VehiclesPage;
