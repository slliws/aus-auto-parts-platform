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
  IconButton,
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

import MainLayout from '../components/templates/MainLayout';
import PageContainer from '../components/templates/PageContainer';
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

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const vehicle = useSelector(selectCurrentVehicle);
  const loading = useSelector(selectVehiclesLoading);
  const error = useSelector(selectVehiclesError);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load vehicle details when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchVehicleById(id));
    }
  }, [dispatch, id]);

  // Handle form dialog open/close
  const handleEditClick = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = (vehicleUpdated: boolean) => {
    setIsFormOpen(false);
    if (vehicleUpdated && id) {
      dispatch(fetchVehicleById(id));
    }
  };

  // Handle delete
  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (id) {
      await dispatch(deleteVehicle(id));
      navigate('/vehicles');
    }
    setConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  // Render vehicle details in formatted table
  const renderVehicleDetails = (vehicle: Vehicle) => (
    <TableContainer component={Paper} elevation={0} variant="outlined">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ width: '30%', bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">VIN</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.vin}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ width: '30%', bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Registration Number</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.registration_number || 'Not specified'}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Make</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.make}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Model</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.model}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Year</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.year}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Engine</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.engine_number || 'Not specified'}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Transmission</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.transmission || 'Not specified'}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Body Type</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.location || 'Not specified'}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Color</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.color || 'Not specified'}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Fuel Type</Typography>
            </TableCell>
            <TableCell>
              <Typography>{vehicle.fuel_type || 'Not specified'}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Status</Typography>
            </TableCell>
            <TableCell>
              {vehicle.is_active ? (
                <Chip label="Active" color="success" size="small" />
              ) : (
                <Chip label="Inactive" color="error" size="small" />
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Show loading state
  if (loading === 'pending') {
    return (
      <MainLayout>
        <PageContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show error
  if (error) {
    return (
      <MainLayout>
        <PageContainer>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/vehicles"
          >
            Back to Vehicles
          </Button>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show vehicle not found
  if (!vehicle) {
    return (
      <MainLayout>
        <PageContainer>
          <Alert severity="info" sx={{ mb: 3 }}>
            Vehicle not found or has been deleted.
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/vehicles"
          >
            Back to Vehicles
          </Button>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              component={Link}
              to="/vehicles"
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" color="textSecondary">
              {vehicle.vin}
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{ mr: 2 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main vehicle details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vehicle Details
              </Typography>
              {renderVehicleDetails(vehicle)}
            </Paper>

            {/* Notes section */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body1" paragraph>
                {vehicle.notes || 'No notes recorded for this vehicle.'}
              </Typography>
            </Paper>
          </Grid>

          {/* Sidebar information */}
          <Grid item xs={12} md={4}>
            {/* Customer information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              {vehicle.customer_id ? (
                <Box>
                  <Button
                    variant="contained"
                    component={Link}
                    to={`/customers/${vehicle.customer_id}`}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    View Customer Profile
                  </Button>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No customer associated with this vehicle.
                </Alert>
              )}
            </Paper>

            {/* Vehicle meta info */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Record Information
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Created:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(vehicle.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Last Updated:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(vehicle.updated_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit vehicle form dialog */}
        <VehicleFormDialog
          open={isFormOpen}
          onClose={handleFormClose}
          vehicle={vehicle}
        />

        {/* Delete confirmation dialog */}
        <Dialog
          open={confirmDelete}
          onClose={handleCancelDelete}
        >
          <DialogTitle>Delete Vehicle?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this vehicle ({vehicle.year} {vehicle.make} {vehicle.model})?
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </MainLayout>
  );
};

export default VehicleDetailPage;