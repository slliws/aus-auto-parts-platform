import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

import {
  Part,
  PartCondition,
  PartsFilters,
  fetchParts,
  createPart,
  updatePart,
  deletePart,
  fetchCategories,
} from '../services/parts.service';
import { RootState } from '../store';
import { selectAuthUser } from '../store/slices/authSlice';

const PartsPage: React.FC = () => {
  // State management
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PartsFilters>({});

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    description: '',
    category: '',
    condition: PartCondition.NEW,
    unitCost: 0,
    sellingPrice: 0,
    gstInclusive: true,
    quantityInStock: 0,
    location: '',
    barcode: '',
  });

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Auth / RBAC
  const currentUser = useSelector((state: RootState) => selectAuthUser(state));
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  // Load data functions
  const loadParts = async () => {
    try {
      setLoading(true);
      const pagination = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
      };

      const result = await fetchParts(filters, pagination);
      setParts(result.data);
      setTotalCount(result.meta.totalItems);
    } catch (error) {
      console.error('Error loading parts:', error);
      setSnackbar({ open: true, message: 'Failed to load parts', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await fetchCategories();
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadCategories();
    loadParts();
  }, [page, rowsPerPage, filters]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery || undefined }));
      setPage(0); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filters
  const handleFilterChange = (key: keyof PartsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setPage(0);
  };

  // Handle add/edit
  const handleAddPart = () => {
    setFormData({
      partNumber: '',
      name: '',
      description: '',
      category: '',
      condition: PartCondition.NEW,
      unitCost: 0,
      sellingPrice: 0,
      gstInclusive: true,
      quantityInStock: 0,
      location: '',
      barcode: '',
    });
    setAddDialogOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      description: part.description || '',
      category: part.category,
      condition: part.condition,
      unitCost: part.unitCost,
      sellingPrice: part.sellingPrice,
      gstInclusive: true,
      quantityInStock: part.quantityInStock,
      location: part.location || '',
      barcode: part.supplierPartNumber || '',
    });
    setEditingPart(part);
    setEditDialogOpen(true);
  };

  const handleDeletePart = (part: Part) => {
    setPartToDelete(part);
    setDeleteConfirmOpen(true);
  };

  const onSubmitAdd = async () => {
    try {
      await createPart(formData);
      setAddDialogOpen(false);
      setSnackbar({ open: true, message: 'Part added successfully', severity: 'success' });
      loadParts();
    } catch (error) {
      console.error('Error adding part:', error);
      setSnackbar({ open: true, message: 'Failed to add part', severity: 'error' });
    }
  };

  const onSubmitEdit = async () => {
    if (!editingPart) return;

    try {
      await updatePart(editingPart.id, formData);
      setEditDialogOpen(false);
      setEditingPart(null);
      setSnackbar({ open: true, message: 'Part updated successfully', severity: 'success' });
      loadParts();
    } catch (error) {
      console.error('Error updating part:', error);
      setSnackbar({ open: true, message: 'Failed to update part', severity: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!partToDelete) return;

    try {
      await deletePart(partToDelete.id);
      setDeleteConfirmOpen(false);
      setPartToDelete(null);
      setSnackbar({ open: true, message: 'Part deleted successfully', severity: 'success' });
      loadParts();
    } catch (error) {
      console.error('Error deleting part:', error);
      setSnackbar({ open: true, message: 'Failed to delete part', severity: 'error' });
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getConditionColor = (condition: PartCondition) => {
    switch (condition) {
      case PartCondition.NEW: return 'success';
      case PartCondition.USED_EXCELLENT: return 'info';
      case PartCondition.USED_GOOD: return 'warning';
      case PartCondition.USED_FAIR: return 'default';
      case PartCondition.RECONDITIONED: return 'secondary';
      case PartCondition.DAMAGED: return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <InventoryIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Parts Inventory
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your auto parts inventory, add new parts, and track stock levels.
            </Typography>
          </Box>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPart}
              size="large"
            >
              Add Part
            </Button>
          )}
        </Box>

        {/* Filters and Search */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category || ''}
                    label="Category"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={filters.condition || ''}
                    label="Condition"
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                  >
                    <MenuItem value="">All Conditions</MenuItem>
                    {Object.values(PartCondition).map((condition) => (
                      <MenuItem key={condition} value={condition}>
                        {condition.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Stock Status</InputLabel>
                  <Select
                    value={filters.inStock !== undefined ? filters.inStock.toString() : ''}
                    label="Stock Status"
                    onChange={(e) => handleFilterChange('inStock', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">In Stock</MenuItem>
                    <MenuItem value="false">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({});
                    setPage(0);
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Parts Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Sell Price</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>Loading parts...</Typography>
                    </TableCell>
                  </TableRow>
                ) : parts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No parts found. Try adjusting your filters or add a new part.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  parts.map((part) => (
                    <TableRow key={part.id} hover>
                      <TableCell>{part.partNumber}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {part.name}
                          </Typography>
                          {part.description && (
                            <Typography variant="caption" color="text.secondary">
                              {part.description.length > 50 ? `${part.description.substring(0, 50)}...` : part.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{part.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={part.condition.replace('_', ' ')}
                          color={getConditionColor(part.condition)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={part.quantityInStock === 0 ? 'error.main' : part.quantityInStock < 5 ? 'warning.main' : 'success.main'}
                          fontWeight="medium"
                        >
                          {part.quantityInStock}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${part.sellingPrice?.toFixed(2)}
                      </TableCell>
                      <TableCell>{part.location || '-'}</TableCell>
                      <TableCell align="center">
                        {canManage ? (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditPart(part)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeletePart(part)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>

        {/* Add Part Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add New Part</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Part Number"
                  fullWidth
                  value={formData.partNumber}
                  onChange={(e) => handleFormChange('partNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.condition}
                    label="Condition"
                    onChange={(e) => handleFormChange('condition', e.target.value as PartCondition)}
                  >
                    {Object.values(PartCondition).map((condition) => (
                      <MenuItem key={condition} value={condition}>
                        {condition.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cost Price"
                  type="number"
                  fullWidth
                  value={formData.unitCost}
                  onChange={(e) => handleFormChange('unitCost', parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Sell Price"
                  type="number"
                  fullWidth
                  value={formData.sellingPrice}
                  onChange={(e) => handleFormChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Stock Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantityInStock}
                  onChange={(e) => handleFormChange('quantityInStock', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Location"
                  fullWidth
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Barcode"
                  fullWidth
                  value={formData.barcode}
                  onChange={(e) => handleFormChange('barcode', e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={onSubmitAdd} variant="contained">
              Add Part
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Part Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Part Number"
                  fullWidth
                  value={formData.partNumber}
                  onChange={(e) => handleFormChange('partNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.condition}
                    label="Condition"
                    onChange={(e) => handleFormChange('condition', e.target.value as PartCondition)}
                  >
                    {Object.values(PartCondition).map((condition) => (
                      <MenuItem key={condition} value={condition}>
                        {condition.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cost Price"
                  type="number"
                  fullWidth
                  value={formData.unitCost}
                  onChange={(e) => handleFormChange('unitCost', parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Sell Price"
                  type="number"
                  fullWidth
                  value={formData.sellingPrice}
                  onChange={(e) => handleFormChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Stock Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantityInStock}
                  onChange={(e) => handleFormChange('quantityInStock', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Location"
                  fullWidth
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Barcode"
                  fullWidth
                  value={formData.barcode}
                  onChange={(e) => handleFormChange('barcode', e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={onSubmitEdit} variant="contained">
              Update Part
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete part "{partToDelete?.name}" ({partToDelete?.partNumber})?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default PartsPage;