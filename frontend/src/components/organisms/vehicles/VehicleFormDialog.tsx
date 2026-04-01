import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { AppDispatch } from '../../../store';
import {
  createVehicle,
  updateVehicle,
  decodeVin,
  selectVinDecodingResult,
  selectVehiclesLoading,
  selectVehiclesError,
  clearVinDecodingResult
} from '../../../store/slices/vehiclesSlice';
import type { Vehicle, CreateVehicleData, UpdateVehicleData } from '../../../services/vehicle.service';
import { fetchCustomers } from '../../../store/slices/customersSlice';
import { selectCustomers } from '../../../store/slices/customersSlice';

// Interface for component props
interface VehicleFormDialogProps {
  open: boolean;
  onClose: (vehicleCreated: boolean) => void;
  vehicle: Vehicle | null;
}

const VehicleFormDialog: React.FC<VehicleFormDialogProps> = ({
  open,
  onClose,
  vehicle
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const vinDecodingResult = useSelector(selectVinDecodingResult);
  const loading = useSelector(selectVehiclesLoading);
  const error = useSelector(selectVehiclesError);
  const customers = useSelector(selectCustomers);

  // Form state
  const [formData, setFormData] = useState<CreateVehicleData | UpdateVehicleData>({
    vin: '',
    registrationNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    engine: '',
    transmission: '',
    color: '',
    bodyType: '',
    fuelType: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDecoding, setIsDecoding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Initialize form with vehicle data if editing
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vin: vehicle.vin || '',
        registrationNumber: vehicle.registration_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        engine: vehicle.engine_number || '',
        transmission: vehicle.transmission || '',
        color: vehicle.color || '',
        bodyType: vehicle.location || '', // using location field for body type
        fuelType: vehicle.fuel_type || '',
        notes: vehicle.notes || '',
        customerId: vehicle.customer_id || undefined
      });
    } else {
      // Reset form for new vehicle
      setFormData({
        vin: '',
        registrationNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        engine: '',
        transmission: '',
        color: '',
        bodyType: '',
        fuelType: '',
        notes: ''
      });
    }
    setErrors({});
  }, [vehicle, open]);

  // Load customers for dropdown
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Update form with VIN decoding result
  useEffect(() => {
    if (vinDecodingResult && isDecoding) {
      setFormData(prev => ({
        ...prev,
        make: vinDecodingResult.make || prev.make,
        model: vinDecodingResult.model || prev.model,
        year: vinDecodingResult.year || prev.year,
        engine: vinDecodingResult.engine || prev.engine,
        transmission: vinDecodingResult.transmission || prev.transmission,
        bodyType: vinDecodingResult.bodyType || prev.bodyType,
        fuelType: vinDecodingResult.fuelType || prev.fuelType,
        color: vinDecodingResult.color || prev.color,
      }));
      setIsDecoding(false);
    }
  }, [vinDecodingResult, isDecoding]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convert year to number if needed
    if (name === 'year' && value) {
      const yearValue = parseInt(value, 10);
      setFormData({ ...formData, [name]: yearValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear errors for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as keyof typeof formData;
    const value = e.target.value;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear errors for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Handle customer selection
  const handleCustomerChange = (_event: React.SyntheticEvent, customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customerId: customer?.id || undefined
    });
  };

  // Decode VIN
  const handleDecodeVin = () => {
    if (!formData.vin) {
      setErrors({ ...errors, vin: 'VIN is required for decoding' });
      return;
    }
    
    setIsDecoding(true);
    dispatch(decodeVin(formData.vin as string));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.vin) {
      newErrors.vin = 'VIN is required';
    } else if ((formData.vin as string).length !== 17) {
      newErrors.vin = 'VIN must be 17 characters';
    }
    
    if (!formData.make) {
      newErrors.make = 'Make is required';
    }
    
    if (!formData.model) {
      newErrors.model = 'Model is required';
    }
    
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else {
      const currentYear = new Date().getFullYear();
      if (formData.year < 1980 || formData.year > currentYear + 1) {
        newErrors.year = `Year must be between 1980 and ${currentYear + 1}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (vehicle) {
        // Update existing vehicle
        await dispatch(updateVehicle({
          id: vehicle.id,
          data: formData as UpdateVehicleData
        }));
      } else {
        // Create new vehicle
        await dispatch(createVehicle(formData as CreateVehicleData));
      }
      onClose(true);
      dispatch(clearVinDecodingResult());
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    dispatch(clearVinDecodingResult());
    onClose(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* VIN Decoder Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            VIN Decoder
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                name="vin"
                label="Vehicle Identification Number (VIN)"
                fullWidth
                value={formData.vin}
                onChange={handleChange}
                error={!!errors.vin}
                helperText={errors.vin || "Enter 17-character VIN"}
                placeholder="e.g. WBAWL73549PX91282"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Standard 17-character vehicle identifier">
                        <HelpIcon fontSize="small" color="action" />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleDecodeVin}
                disabled={loading === 'pending' || !formData.vin}
                startIcon={isDecoding ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{ height: '56px' }}
                fullWidth
              >
                {isDecoding ? 'Decoding...' : 'Decode VIN'}
              </Button>
            </Grid>
            {vinDecodingResult && (
              <Grid item xs={12}>
                <Alert severity={vinDecodingResult.isValid ? "success" : "warning"} sx={{ mt: 1 }}>
                  {vinDecodingResult.isValid 
                    ? "VIN decoded successfully! Vehicle details have been populated." 
                    : vinDecodingResult.error || "VIN decoded with warnings. Please verify the information."}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Vehicle Details */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Vehicle Details
          </Typography>
          <Grid container spacing={3}>
            {/* Customer Selection */}
            <Grid item xs={12}>
              <Autocomplete
                options={customers || []}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                value={selectedCustomer}
                onChange={handleCustomerChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer (Optional)"
                    placeholder="Search for a customer"
                  />
                )}
              />
              <FormHelperText>
                Associate this vehicle with a customer or leave blank
              </FormHelperText>
            </Grid>
            
            {/* Registration */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="registrationNumber"
                label="Registration Number"
                fullWidth
                value={formData.registrationNumber || ''}
                onChange={handleChange}
                placeholder="e.g. ABC-123"
              />
            </Grid>
            
            {/* Make */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="make"
                label="Make"
                fullWidth
                required
                value={formData.make || ''}
                onChange={handleChange}
                error={!!errors.make}
                helperText={errors.make}
                placeholder="e.g. Toyota"
              />
            </Grid>
            
            {/* Model */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label="Model"
                fullWidth
                required
                value={formData.model || ''}
                onChange={handleChange}
                error={!!errors.model}
                helperText={errors.model}
                placeholder="e.g. Camry"
              />
            </Grid>
            
            {/* Year */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="year"
                label="Year"
                type="number"
                fullWidth
                required
                value={formData.year || ''}
                onChange={handleChange}
                error={!!errors.year}
                helperText={errors.year}
                inputProps={{ min: 1980, max: new Date().getFullYear() + 1 }}
              />
            </Grid>
            
            {/* Engine */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="engine"
                label="Engine Number/Details"
                fullWidth
                value={formData.engine || ''}
                onChange={handleChange}
                placeholder="e.g. 2.5L 4-cylinder"
              />
            </Grid>
            
            {/* Transmission */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="transmission-label">Transmission</InputLabel>
                <Select
                  labelId="transmission-label"
                  name="transmission"
                  value={formData.transmission || ''}
                  onChange={handleSelectChange}
                  label="Transmission"
                >
                  <MenuItem value="">None Selected</MenuItem>
                  <MenuItem value="Automatic">Automatic</MenuItem>
                  <MenuItem value="Manual">Manual</MenuItem>
                  <MenuItem value="CVT">CVT</MenuItem>
                  <MenuItem value="Semi-Automatic">Semi-Automatic</MenuItem>
                  <MenuItem value="Dual-Clutch">Dual-Clutch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Color */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="color"
                label="Color"
                fullWidth
                value={formData.color || ''}
                onChange={handleChange}
                placeholder="e.g. Silver"
              />
            </Grid>
            
            {/* Body Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="body-type-label">Body Type</InputLabel>
                <Select
                  labelId="body-type-label"
                  name="bodyType"
                  value={formData.bodyType || ''}
                  onChange={handleSelectChange}
                  label="Body Type"
                >
                  <MenuItem value="">None Selected</MenuItem>
                  <MenuItem value="Sedan">Sedan</MenuItem>
                  <MenuItem value="Hatchback">Hatchback</MenuItem>
                  <MenuItem value="SUV">SUV</MenuItem>
                  <MenuItem value="Wagon">Wagon</MenuItem>
                  <MenuItem value="Coupe">Coupe</MenuItem>
                  <MenuItem value="Convertible">Convertible</MenuItem>
                  <MenuItem value="Ute">Ute</MenuItem>
                  <MenuItem value="Van">Van</MenuItem>
                  <MenuItem value="Truck">Truck</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Fuel Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="fuel-type-label">Fuel Type</InputLabel>
                <Select
                  labelId="fuel-type-label"
                  name="fuelType"
                  value={formData.fuelType || ''}
                  onChange={handleSelectChange}
                  label="Fuel Type"
                >
                  <MenuItem value="">None Selected</MenuItem>
                  <MenuItem value="Petrol">Petrol</MenuItem>
                  <MenuItem value="Diesel">Diesel</MenuItem>
                  <MenuItem value="Hybrid">Hybrid</MenuItem>
                  <MenuItem value="Electric">Electric</MenuItem>
                  <MenuItem value="LPG">LPG</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={4}
                value={formData.notes || ''}
                onChange={handleChange}
                placeholder="Additional information about the vehicle..."
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading === 'pending'}
        >
          {loading === 'pending' ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Saving...
            </>
          ) : (
            vehicle ? 'Update Vehicle' : 'Add Vehicle'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleFormDialog;