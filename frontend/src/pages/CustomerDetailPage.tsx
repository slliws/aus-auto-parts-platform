import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  House as HouseIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { AppDispatch, RootState } from '../store';
import {
  fetchCustomerById,
  fetchCustomerOrders,
  deleteCustomer,
  selectCurrentCustomer,
  selectCustomerOrders,
  selectCustomersLoading,
  selectCustomersError,
} from '../store/slices/customersSlice';
import { CustomerType } from '../services/customers.service';
import { selectAuthUser } from '../store/slices/authSlice';
import CustomerFormDialog from '../components/organisms/customers/CustomerFormDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Tab Panel Component
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

/**
 * Customer Detail Page
 * Displays comprehensive customer information and related data
 */
const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const customer = useSelector(selectCurrentCustomer);
  const customerOrders = useSelector(selectCustomerOrders);
  const loading = useSelector(selectCustomersLoading);
  const error = useSelector(selectCustomersError);
  const currentUser = useSelector((state: RootState) => selectAuthUser(state));
  const canDelete = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch customer data on component mount
  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
      dispatch(fetchCustomerOrders({ customerId: id }));
    }
  }, [dispatch, id]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Navigate back to customers list
  const handleBackToList = () => {
    navigate('/customers');
  };

  // Handle edit customer
  const handleEditCustomer = () => {
    setOpenDialog(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (id && window.confirm('Are you sure you want to delete this customer?')) {
      const result = await dispatch(deleteCustomer(id));
      if (deleteCustomer.fulfilled.match(result)) {
        navigate('/customers');
      }
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    setOpenDialog(false);
    if (id) {
      dispatch(fetchCustomerById(id));
    }
  };

  // Format customer name
  const formatCustomerName = () => {
    if (!customer) return '';
    return `${customer.first_name} ${customer.last_name}`;
  };

  // Format customer type for display
  const formatCustomerType = (type: CustomerType) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  // Get chip color based on customer type
  const getCustomerTypeColor = (type: CustomerType) => {
    return type === 'RETAIL' ? 'default' : 
           type === 'TRADE' ? 'primary' : 
           'secondary';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Order history columns
  const orderColumns: GridColDef[] = [
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 150,
    },
    {
      field: 'created_at',
      headerName: 'Date',
      width: 150,
      valueFormatter: (params) => formatDate(params.value as string),
    },
    {
      field: 'total_amount',
      headerName: 'Amount',
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value as number),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        const color = 
          status === 'COMPLETED' ? 'success' :
          status === 'PENDING' ? 'warning' :
          status === 'CANCELLED' ? 'error' : 'default';
        
        return (
          <Chip 
            label={status.charAt(0) + status.slice(1).toLowerCase()} 
            size="small" 
            color={color}
          />
        );
      },
    },
    {
      field: 'payment_status',
      headerName: 'Payment',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        const color = 
          status === 'PAID' ? 'success' :
          status === 'PENDING' ? 'warning' :
          status === 'FAILED' ? 'error' : 'default';
        
        return (
          <Chip 
            label={status.charAt(0) + status.slice(1).toLowerCase()} 
            size="small" 
            color={color}
          />
        );
      },
    },
  ];

  // Display loading state
  if (loading === 'pending' && !customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Display error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Customers List
        </Button>
      </Box>
    );
  }

  // Display "not found" state
  if (!customer && loading !== 'pending') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Customer not found
        </Alert>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Customers List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button variant="outlined" onClick={handleBackToList} sx={{ mb: 1 }}>
            Back to Customers List
          </Button>
          <Typography variant="h4" component="h1">
            {formatCustomerName()}
            <Chip 
              label={formatCustomerType(customer?.customer_type as CustomerType)} 
              size="small"
              color={getCustomerTypeColor(customer?.customer_type as CustomerType)}
              sx={{ ml: 2 }}
            />
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditCustomer}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteCustomer}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Customer Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Orders</Typography>
              <Typography variant="h4">{customer?._count?.orders || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Total Spent</Typography>
              <Typography variant="h4">{formatCurrency(customer?.totalSpent || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Last Order</Typography>
              <Typography variant="h4">
                {customerOrders && customerOrders.length > 0 
                  ? formatDate(customerOrders[0].created_at) 
                  : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">Status</Typography>
              <Typography variant="h4">
                <Chip 
                  label={customer?.is_active ? 'Active' : 'Inactive'} 
                  color={customer?.is_active ? 'success' : 'default'}
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Action Buttons */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptIcon />}
              onClick={() => alert("Create Quote functionality would be implemented here")}
            >
              Create Quote
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ShoppingCartIcon />}
              onClick={() => alert("Create Order functionality would be implemented here")}
            >
              Create Order
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer tabs">
          <Tab label="Overview" id="customer-tab-0" aria-controls="customer-tabpanel-0" />
          <Tab label="Orders" id="customer-tab-1" aria-controls="customer-tabpanel-1" />
          <Tab label="Vehicles" id="customer-tab-2" aria-controls="customer-tabpanel-2" />
          <Tab label="Notes" id="customer-tab-3" aria-controls="customer-tabpanel-3" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Contact Information" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ mr: 1 }} fontSize="small" />
                            <Typography variant="body1">Email</Typography>
                          </Box>
                        }
                        secondary={customer?.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ mr: 1 }} fontSize="small" />
                            <Typography variant="body1">Phone</Typography>
                          </Box>
                        }
                        secondary={customer?.phone}
                      />
                    </ListItem>
                    {customer?.mobile && (
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body1">Mobile</Typography>
                            </Box>
                          }
                          secondary={customer?.mobile}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Business Information" />
                <CardContent>
                  <List>
                    {customer?.company_name && (
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <BusinessIcon sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body1">Company</Typography>
                            </Box>
                          }
                          secondary={customer?.company_name}
                        />
                      </ListItem>
                    )}
                    {customer?.abn && (
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <BusinessIcon sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body1">ABN</Typography>
                            </Box>
                          }
                          secondary={customer?.abn}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1 }} fontSize="small" />
                            <Typography variant="body1">Customer Type</Typography>
                          </Box>
                        }
                        secondary={formatCustomerType(customer?.customer_type as CustomerType)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1 }} fontSize="small" />
                            <Typography variant="body1">Tax Exempt</Typography>
                          </Box>
                        }
                        secondary={customer?.tax_exempt ? 'Yes' : 'No'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader title="Address Information" />
                <CardContent>
                  <List>
                    {customer?.address && (
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HouseIcon sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body1">Address</Typography>
                            </Box>
                          }
                          secondary={customer?.address}
                        />
                      </ListItem>
                    )}
                    {(customer?.suburb || customer?.state || customer?.postcode) && (
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <HouseIcon sx={{ mr: 1 }} fontSize="small" />
                              <Typography variant="body1">Suburb/State/Postcode</Typography>
                            </Box>
                          }
                          secondary={`${customer?.suburb || ''} ${customer?.state || ''} ${customer?.postcode || ''}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Orders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Order History</Typography>
          {customerOrders && customerOrders.length > 0 ? (
            <DataGrid
              rows={customerOrders}
              columns={orderColumns}
              autoHeight
              disableSelectionOnClick
              pageSize={5}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
            />
          ) : (
            <Alert severity="info">No orders found for this customer</Alert>
          )}
        </TabPanel>

        {/* Vehicles Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Customer Vehicles</Typography>
          <Alert severity="info">
            Vehicle management functionality would be implemented here. This would display any vehicles associated with this customer.
          </Alert>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Notes</Typography>
          <Card>
            <CardContent>
              {customer?.notes ? (
                <Typography>{customer.notes}</Typography>
              ) : (
                <Typography color="textSecondary">No notes available</Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={openDialog}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        customer={customer}
      />
    </Box>
  );
};

export default CustomerDetailPage;