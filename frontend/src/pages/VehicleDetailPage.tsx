import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import VehicleFormDialog from '../components/organisms/vehicles/VehicleFormDialog';
import { AppDispatch } from '../store';
import {
  fetchVehicleById,
  selectCurrentVehicle,
  selectVehiclesLoading,
  selectVehiclesError,
  deleteVehicle
} from '../store/slices/vehiclesSlice';
import { Vehicle } from '../services/vehicle.service';

const statusColor: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  INTAKE: 'warning',
  DISMANTLING: 'info',
  COMPLETE: 'success',
  SOLD: 'default',
};

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const vehicle = useSelector(selectCurrentVehicle);
  const loading = useSelector(selectVehiclesLoading);
  const error = useSelector(selectVehiclesError);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleById(id));
    }
  }, [dispatch, id]);

  const handleFormClose = (vehicleUpdated: boolean) => {
    setIsFormOpen(false);
    if (vehicleUpdated && id) {
      dispatch(fetchVehicleById(id));
    }
  };

  const handleConfirmDelete = async () => {
    if (id) {
      await dispatch(deleteVehicle(id));
      navigate('/vehicles');
    }
    setConfirmDelete(false);
  };

  const renderVehicleDetails = (v: Vehicle) => (
    <TableContainer component={Paper} elevation={0} variant="outlined">
      <Table>
        <TableBody>
          {[
            ['VIN', <Typography fontFamily="monospace">{v.vin || '—'}</Typography>],
            ['Registration', v.registration_number || '—'],
            ['Make', v.make],
            ['Model', v.model],
            ['Year', v.year],
            ['Engine', v.engine_number || '—'],
            ['Transmission', v.transmission || '—'],
            ['Body Type', v.location || '—'],
            ['Color', v.color || '—'],
            ['Fuel Type', v.fuel_type || '—'],
            ['Status',
              <Chip
                label={(v as any).status ?? 'INTAKE'}
                size="small"
                color={statusColor[(v as any).status ?? 'INTAKE'] ?? 'default'}
              />
            ],
          ].map(([label, value]) => (
            <TableRow key={String(label)}>
              <TableCell component="th" scope="row" sx={{ width: '30%', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2">{label}</Typography>
              </TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading === 'pending') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} component={Link} to="/vehicles">
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>Vehicle not found or has been deleted.</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} component={Link} to="/vehicles">
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} component={Link} to="/vehicles" sx={{ mr: 2 }}>
            Back
          </Button>
          <Typography variant="h5" fontWeight="bold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Typography>
          {(vehicle as any).status && (
            <Chip
              label={(vehicle as any).status}
              size="small"
              color={statusColor[(vehicle as any).status] ?? 'default'}
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
            {vehicle.vin}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsFormOpen(true)}>
              Edit
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main vehicle details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Vehicle Details</Typography>
            {renderVehicleDetails(vehicle)}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notes</Typography>
            <Typography variant="body1">
              {vehicle.notes || 'No notes recorded for this vehicle.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Customer</Typography>
            {vehicle.customer_id ? (
              <Button
                variant="contained"
                component={Link}
                to={`/customers/${vehicle.customer_id}`}
                fullWidth
              >
                View Customer Profile
              </Button>
            ) : (
              <Alert severity="info">No customer associated with this vehicle.</Alert>
            )}
          </Paper>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Record Information
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Date Received:</Typography>
                <Typography variant="body2">
                  {vehicle.date_received ? new Date(vehicle.date_received).toLocaleDateString('en-AU') : '—'}
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Created:</Typography>
                <Typography variant="body2">
                  {new Date(vehicle.created_at).toLocaleDateString('en-AU')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Last Updated:</Typography>
                <Typography variant="body2">
                  {new Date(vehicle.updated_at).toLocaleDateString('en-AU')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit dialog */}
      <VehicleFormDialog open={isFormOpen} onClose={handleFormClose} vehicle={vehicle} />

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete Vehicle?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {vehicle.year} {vehicle.make} {vehicle.model}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleDetailPage;
