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
  Typography,
  Divider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppDispatch } from '../../../store';
import { createCustomer, updateCustomer } from '../../../store/slices/customersSlice';
import { CustomerType } from '../../../services/customers.service';

/**
 * Customer type options
 */
const CUSTOMER_TYPES = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'TRADE', label: 'Trade' },
  { value: 'WHOLESALE', label: 'Wholesale' },
];

/**
 * Payment method options
 */
const PAYMENT_METHODS = [
  'Direct Deposit',
  'Credit Card',
  'Cash',
  'Cheque',
  'PayPal',
  'Bank Transfer',
  '30-Day Account',
];

/**
 * Australian states
 */
const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];

/**
 * Form validation schema
 */
const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  mobile: z.string().optional(),
  customerType: z.enum(['RETAIL', 'TRADE', 'WHOLESALE']),
  companyName: z.string().optional(),
  abn: z.string()
    .refine(val => !val || /^\d{11}$/.test(val), {
      message: 'ABN must be exactly 11 digits'
    })
    .optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string()
    .refine(val => !val || /^\d{4}$/.test(val), {
      message: 'Australian postcode must be exactly 4 digits'
    })
    .optional(),
  preferredPaymentMethod: z.string().optional(),
  taxExempt: z.boolean().default(false),
  notes: z.string().optional(),
});

/**
 * Customer form data interface
 */
type CustomerFormData = z.infer<typeof customerSchema>;

/**
 * Component props
 */
interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any; // Existing customer for editing, null for creating new
}

/**
 * Customer Form Dialog Component
 * Modal dialog for creating and editing customers
 */
const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  customer,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get form methods from react-hook-form with zod validation
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      customerType: 'RETAIL',
      companyName: '',
      abn: '',
      address: '',
      suburb: '',
      state: '',
      postcode: '',
      preferredPaymentMethod: '',
      taxExempt: false,
      notes: '',
    },
  });

  // Watch customer type to conditionally show/hide fields
  const customerType = watch('customerType');

  // Reset form when customer changes or dialog opens
  useEffect(() => {
    if (open) {
      if (customer) {
        // Editing existing customer
        reset({
          firstName: customer.first_name || '',
          lastName: customer.last_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          mobile: customer.mobile || '',
          customerType: customer.customer_type || 'RETAIL',
          companyName: customer.company_name || '',
          abn: customer.abn || '',
          address: customer.address || '',
          suburb: customer.suburb || '',
          state: customer.state || '',
          postcode: customer.postcode || '',
          preferredPaymentMethod: customer.preferred_payment_method || '',
          taxExempt: customer.tax_exempt || false,
          notes: customer.notes || '',
        });
      } else {
        // Creating new customer
        reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          mobile: '',
          customerType: 'RETAIL',
          companyName: '',
          abn: '',
          address: '',
          suburb: '',
          state: '',
          postcode: '',
          preferredPaymentMethod: '',
          taxExempt: false,
          notes: '',
        });
      }
      setError(null);
    }
  }, [open, customer, reset]);

  // Handle form submission
  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (customer) {
        // Update existing customer
        await dispatch(updateCustomer({
          id: customer.id,
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            mobile: data.mobile,
            customerType: data.customerType,
            companyName: data.companyName,
            abn: data.abn,
            address: data.address,
            suburb: data.suburb,
            state: data.state,
            postcode: data.postcode,
            preferredPaymentMethod: data.preferredPaymentMethod,
            taxExempt: data.taxExempt,
            notes: data.notes,
          },
        })).unwrap();
      } else {
        // Create new customer
        await dispatch(createCustomer({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          mobile: data.mobile,
          customerType: data.customerType,
          companyName: data.companyName,
          abn: data.abn,
          address: data.address,
          suburb: data.suburb,
          state: data.state,
          postcode: data.postcode,
          preferredPaymentMethod: data.preferredPaymentMethod,
          taxExempt: data.taxExempt,
          notes: data.notes,
        })).unwrap();
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the customer');
    } finally {
      setLoading(false);
    }
  };

  // Check if ABN field should be shown
  const showAbnField = customerType === 'TRADE' || customerType === 'WHOLESALE';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {customer ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="medium">
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {/* First Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    required
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    required
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    required
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>

            {/* Mobile */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mobile"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Customer Type */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="customerType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Customer Type"
                    fullWidth
                    required
                    error={!!errors.customerType}
                    helperText={errors.customerType?.message}
                  >
                    {CUSTOMER_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Business Information (conditionally shown) */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Business Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Company Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Company Name"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* ABN (conditionally shown) */}
            {showAbnField && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="abn"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ABN (Australian Business Number)"
                      fullWidth
                      error={!!errors.abn}
                      helperText={errors.abn?.message}
                      placeholder="11 digits"
                    />
                  )}
                />
              </Grid>
            )}

            {/* Address Information */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Street Address */}
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Street Address"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* Suburb/City */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="suburb"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Suburb/City"
                    fullWidth
                  />
                )}
              />
            </Grid>

            {/* State */}
            <Grid item xs={12} sm={3}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="State"
                    fullWidth
                  >
                    {AUSTRALIAN_STATES.map((state) => (
                      <MenuItem key={state.value} value={state.value}>
                        {state.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Postcode */}
            <Grid item xs={12} sm={3}>
              <Controller
                name="postcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Postcode"
                    fullWidth
                    error={!!errors.postcode}
                    helperText={errors.postcode?.message}
                    placeholder="4 digits"
                  />
                )}
              />
            </Grid>

            {/* Preferences */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* Preferred Payment Method */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="preferredPaymentMethod"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Preferred Payment Method"
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>None Selected</em>
                    </MenuItem>
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Tax Exempt */}
            <Grid item xs={12}>
              <Controller
                name="taxExempt"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                      />
                    }
                    label="Tax Exempt"
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Additional Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

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
                    rows={3}
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
            {loading ? 'Saving...' : (customer ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerFormDialog;