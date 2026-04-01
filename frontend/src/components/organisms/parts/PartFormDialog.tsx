import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { AppDispatch } from '../../../store';
import { createPart, updatePart } from '../../../store/slices/partsSlice';

/**
 * Part condition options
 */
const PART_CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'USED_EXCELLENT', label: 'Used - Excellent' },
  { value: 'USED_GOOD', label: 'Used - Good' },
  { value: 'USED_FAIR', label: 'Used - Fair' },
  { value: 'RECONDITIONED', label: 'Reconditioned' },
  { value: 'DAMAGED', label: 'Damaged' },
];

/**
 * Part category options
 */
const PART_CATEGORIES = [
  'Engine',
  'Transmission',
  'Suspension',
  'Brakes',
  'Electrical',
  'Body',
  'Interior',
  'Exhaust',
  'Cooling',
  'Fuel System',
  'Steering',
  'Wheels & Tires',
];

/**
 * Part form data interface
 */
interface PartFormData {
  partNumber: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  costPrice: number;
  sellPrice: number;
  gstInclusive: boolean;
  stockQuantity: number;
  location: string;
  barcode: string;
  weight: number;
  dimensions: string;
  notes: string;
}

/**
 * Component props
 */
interface PartFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  part?: any; // Existing part for editing, null for creating new
}

/**
 * Part Form Dialog Component
 * Modal dialog for creating and editing parts
 */
const PartFormDialog: React.FC<PartFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  part,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartFormData>({
    defaultValues: {
      partNumber: '',
      name: '',
      description: '',
      category: '',
      condition: 'USED_GOOD',
      costPrice: 0,
      sellPrice: 0,
      gstInclusive: true,
      stockQuantity: 1,
      location: '',
      barcode: '',
      weight: 0,
      dimensions: '',
      notes: '',
    },
  });

  // Reset form when part changes or dialog opens
  useEffect(() => {
    if (open) {
      if (part) {
        // Editing existing part
        reset({
          partNumber: part.part_number || '',
          name: part.name || '',
          description: part.description || '',
          category: part.category || '',
          condition: part.condition || 'USED_GOOD',
          costPrice: parseFloat(part.cost_price) || 0,
          sellPrice: parseFloat(part.sell_price) || 0,
          gstInclusive: part.gst_inclusive !== false,
          stockQuantity: part.stock_quantity || 1,
          location: part.location || '',
          barcode: part.barcode || '',
          weight: parseFloat(part.weight) || 0,
          dimensions: part.dimensions || '',
          notes: part.notes || '',
        });
      } else {
        // Creating new part
        reset({
          partNumber: '',
          name: '',
          description: '',
          category: '',
          condition: 'USED_GOOD',
          costPrice: 0,
          sellPrice: 0,
          gstInclusive: true,
          stockQuantity: 1,
          location: '',
          barcode: '',
          weight: 0,
          dimensions: '',
          notes: '',
        });
      }
      setError(null);
    }
  }, [open, part, reset]);

  // Handle form submission
  const onSubmit = async (data: PartFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (part) {
        // Update existing part
        await dispatch(updatePart({
          id: part.id,
          data: {
            partNumber: data.partNumber,
            name: data.name,
            description: data.description,
            category: data.category,
            condition: data.condition,
            costPrice: data.costPrice,
            sellPrice: data.sellPrice,
            gstInclusive: data.gstInclusive,
            stockQuantity: data.stockQuantity,
            location: data.location,
            barcode: data.barcode,
            weight: data.weight,
            dimensions: data.dimensions,
            notes: data.notes,
          },
        })).unwrap();
      } else {
        // Create new part
        await dispatch(createPart({
          partNumber: data.partNumber,
          name: data.name,
          description: data.description,
          category: data.category,
          condition: data.condition,
          costPrice: data.costPrice,
          sellPrice: data.sellPrice,
          gstInclusive: data.gstInclusive,
          stockQuantity: data.stockQuantity,
          location: data.location,
          barcode: data.barcode,
          weight: data.weight,
          dimensions: data.dimensions,
          notes: data.notes,
        })).unwrap();
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {part ? 'Edit Part' : 'Add New Part'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Part Number */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="partNumber"
                control={control}
                rules={{ required: 'Part number is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Number"
                    fullWidth
                    required
                    error={!!errors.partNumber}
                    helperText={errors.partNumber?.message}
                  />
                )}
              />
            </Grid>

            {/* Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Part name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Part Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Category"
                    fullWidth
                    required
                    error={!!errors.category}
                    helperText={errors.category?.message}
                  >
                    {PART_CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Condition */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Condition"
                    fullWidth
                  >
                    {PART_CONDITIONS.map((condition) => (
                      <MenuItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Cost Price */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="costPrice"
                control={control}
                rules={{ 
                  required: 'Cost price is required',
                  min: { value: 0, message: 'Must be positive' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cost Price"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                    error={!!errors.costPrice}
                    helperText={errors.costPrice?.message}
                  />
                )}
              />
            </Grid>

            {/* Sell Price */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="sellPrice"
                control={control}
                rules={{ 
                  required: 'Sell price is required',
                  min: { value: 0, message: 'Must be positive' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sell Price"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                    error={!!errors.sellPrice}
                    helperText={errors.sellPrice?.message}
                  />
                )}
              />
            </Grid>

            {/* Stock Quantity */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="stockQuantity"
                control={control}
                rules={{ min: { value: 0, message: 'Must be positive' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Stock Quantity"
                    type="number"
                    fullWidth
                    inputProps={{ min: '0' }}
                    error={!!errors.stockQuantity}
                    helperText={errors.stockQuantity?.message}
                  />
                )}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Location"
                    fullWidth
                    placeholder="e.g., Shelf A-12"
                  />
                )}
              />
            </Grid>

            {/* Barcode */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Barcode"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Weight */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Weight (kg)"
                    type="number"
                    fullWidth
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                )}
              />
            </Grid>

            {/* Dimensions */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="dimensions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dimensions"
                    fullWidth
                    placeholder="L x W x H (cm)"
                  />
                )}
              />
            </Grid>

            {/* GST Inclusive */}
            <Grid item xs={12}>
              <Controller
                name="gstInclusive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                      />
                    }
                    label="GST Inclusive"
                  />
                )}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : (part ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PartFormDialog;