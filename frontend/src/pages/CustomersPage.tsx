import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { AppDispatch } from '../store';
import {
  fetchCustomers,
  deleteCustomer,
  setCustomerFilters,
  clearCustomerFilters,
  selectCustomers,
  selectCustomersLoading,
  selectCustomersError,
  selectCustomersPagination,
  selectCustomerFilters,
} from '../store/slices/customersSlice';
import { CustomerType } from '../services/customers.service';
import CustomerFormDialog from '../components/organisms/customers/CustomerFormDialog';

/**
 * Customers Page
 * Displays and manages customer records
 */
const CustomersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const customers = useSelector(selectCustomers);
  const loading = useSelector(selectCustomersLoading);
  const error = useSelector(selectCustomersError);
  const pagination = useSelector(selectCustomersPagination);
  const filters = useSelector(selectCustomerFilters);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerType, setSelectedCustomerType] = useState<CustomerType | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Fetch customers on component mount and when filters change
  useEffect(() => {
    dispatch(fetchCustomers({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      filters,
    }));
  }, [dispatch, filters, pagination.currentPage, pagination.itemsPerPage]);

  // Handle search
  const handleSearch = () => {
    dispatch(setCustomerFilters({ ...filters, search: searchQuery }));
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle customer type filter
  const handleCustomerTypeChange = (event: any) => {
    const customerType = event.target.value as CustomerType | '';
    setSelectedCustomerType(customerType);
    dispatch(setCustomerFilters({ ...filters, customerType: customerType || undefined }));
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchCustomers({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      filters,
    }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCustomerType('');
    dispatch(clearCustomerFilters());
  };

  // Handle add new customer
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setOpenDialog(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  // Navigate to view customer
  const handleViewCustomer = (customer: any) => {
    // This will be implemented when we create the customer detail page
    console.log('View customer', customer);
    // For now, we'll just alert the user
    alert(`View Customer functionality will be implemented in the next step. Customer ID: ${customer.id}`);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    dispatch(fetchCustomers({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      filters,
    }));
  };

  // Handle delete customer
  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await dispatch(deleteCustomer(customerId));
      dispatch(fetchCustomers({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        filters,
      }));
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    dispatch(fetchCustomers({
      page: newPage + 1,
      limit: pagination.itemsPerPage,
      filters,
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    dispatch(fetchCustomers({
      page: 1,
      limit: newPageSize,
      filters,
    }));
  };

  // Format customer name
  const formatCustomerName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`;
  };

  // Format customer type for display
  const formatCustomerType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      flex: 1,
      valueGetter: (params) => formatCustomerName(params.row.first_name, params.row.last_name),
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      flex: 1,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'company_name',
      headerName: 'Company',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'customer_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const type = params.value as CustomerType;
        const color = type === 'RETAIL' ? 'default' : 
                      type === 'TRADE' ? 'primary' : 
                      'secondary';
        
        return (
          <Chip 
            label={formatCustomerType(type)} 
            size="small"
            color={color}
          />
        );
      },
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'} 
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            color="info"
            onClick={() => handleViewCustomer(params.row)}
            title="View"
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditCustomer(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteCustomer(params.row.id)}
            title="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Customer Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Add New Customer
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            size="medium"
          >
            Search
          </Button>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Customer Type</InputLabel>
            <Select
              value={selectedCustomerType}
              onChange={handleCustomerTypeChange}
              label="Customer Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="RETAIL">Retail</MenuItem>
              <MenuItem value="TRADE">Trade</MenuItem>
              <MenuItem value="WHOLESALE">Wholesale</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
          <IconButton
            onClick={handleRefresh}
            title="Refresh"
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* DataGrid */}
      <Paper>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading === 'pending'}
          pagination
          paginationMode="server"
          rowCount={pagination.totalItems}
          page={pagination.currentPage - 1}
          pageSize={pagination.itemsPerPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          autoHeight
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={openDialog}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        customer={editingCustomer}
      />
    </Box>
  );
};

export default CustomersPage;