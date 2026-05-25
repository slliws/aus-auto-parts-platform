import React, { useEffect, useState, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  PersonOff as DeactivateIcon,
  PersonAdd as ActivateIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
  clearUsersError,
  type User,
} from '../store/slices/usersSlice';
import { selectAuthUser } from '../store/slices/authSlice';

const ROLE_OPTIONS: User['role'][] = ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'INVENTORY', 'ACCOUNTANT', 'CUSTOMER'];

const roleColor = (role: User['role']): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  switch (role) {
    case 'OWNER': return 'error';
    case 'ADMIN': return 'warning';
    case 'MANAGER': return 'primary';
    case 'SALES': return 'success';
    case 'INVENTORY': return 'info';
    case 'ACCOUNTANT': return 'secondary';
    default: return 'default';
  }
};

interface UserFormState {
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  password: string;
}

const emptyForm: UserFormState = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'SALES',
  password: '',
};

/**
 * UsersPage
 * Team / user management — ADMIN only view.
 * Lists all tenant users, create/edit/delete/activate/deactivate.
 */
const UsersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
  const pagination = useSelector(selectUsersPagination);
  const currentUser = useSelector((state: RootState) => selectAuthUser(state));

  // Only ADMIN/OWNER can manage users
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role'] | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const loadUsers = useCallback(() => {
    dispatch(fetchUsers({
      page: page + 1,
      limit: rowsPerPage,
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    }));
  }, [dispatch, page, rowsPerPage, searchQuery, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- Search ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  // --- Form ---
  const openCreate = () => {
    setEditingUser(null);
    setFormState(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormState({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: '',
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (editingUser) {
      const updateData: Partial<User> = {
        firstName: formState.firstName,
        lastName: formState.lastName,
        role: formState.role,
      };
      const result = await dispatch(updateUser({ id: editingUser.id, data: updateData }));
      if (updateUser.fulfilled.match(result)) {
        showToast('User updated successfully');
        setFormOpen(false);
      } else {
        showToast(String(result.payload ?? 'Update failed'), 'error');
      }
    } else {
      const result = await dispatch(createUser(formState));
      if (createUser.fulfilled.match(result)) {
        showToast('User created successfully');
        setFormOpen(false);
        loadUsers();
      } else {
        showToast(String(result.payload ?? 'Create failed'), 'error');
      }
    }
  };

  // --- Delete ---
  const handleDeleteClick = (user: User) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteUser(deleteTarget.id));
    setDeleteOpen(false);
    if (deleteUser.fulfilled.match(result)) {
      showToast(`${deleteTarget.firstName} ${deleteTarget.lastName} removed`);
    } else {
      showToast(String(result.payload ?? 'Delete failed'), 'error');
    }
    setDeleteTarget(null);
  };

  // --- Activate / Deactivate ---
  const handleToggleActive = async (user: User) => {
    if (user.isActive) {
      const result = await dispatch(deactivateUser(user.id));
      if (deactivateUser.fulfilled.match(result)) {
        showToast(`${user.firstName} deactivated`);
      } else {
        showToast(String(result.payload ?? 'Failed'), 'error');
      }
    } else {
      const result = await dispatch(activateUser(user.id));
      if (activateUser.fulfilled.match(result)) {
        showToast(`${user.firstName} activated`);
      } else {
        showToast(String(result.payload ?? 'Failed'), 'error');
      }
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Team / Users</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage staff accounts and roles for this tenant
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadUsers} disabled={loading === 'pending'}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Add User
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value as User['role'] | ''); setPage(0); }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {ROLE_OPTIONS.map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button type="submit" variant="outlined" startIcon={<SearchIcon />}>Search</Button>
        </Box>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearUsersError())}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper>
        {loading === 'pending' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {loading !== 'pending' && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  {canManage && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : users.map(user => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ opacity: user.isActive ? 1 : 0.55 }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          {user.id === currentUser?.id && (
                            <Typography variant="caption" color="primary">(you)</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={user.role} color={roleColor(user.role)} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Chip icon={<ActiveIcon />} label="Active" color="success" size="small" variant="outlined" />
                      ) : (
                        <Chip icon={<InactiveIcon />} label="Inactive" color="default" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString('en-AU')}
                      </Typography>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {/* Only ADMIN/OWNER can toggle active on OTHER users */}
                          {user.id !== currentUser?.id && (
                            <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={user.isActive ? 'warning' : 'success'}
                                onClick={() => handleToggleActive(user)}
                              >
                                {user.isActive ? <DeactivateIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          )}
                          {user.id !== currentUser?.id && (
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => openEdit(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          )}
                          {user.id !== currentUser?.id && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteClick(user)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={pagination.totalItems}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={formState.firstName}
                onChange={e => setFormState(s => ({ ...s, firstName: e.target.value }))}
                fullWidth
                required
                size="small"
              />
              <TextField
                label="Last Name"
                value={formState.lastName}
                onChange={e => setFormState(s => ({ ...s, lastName: e.target.value }))}
                fullWidth
                required
                size="small"
              />
            </Box>
            <TextField
              label="Email"
              type="email"
              value={formState.email}
              onChange={e => setFormState(s => ({ ...s, email: e.target.value }))}
              fullWidth
              required
              size="small"
              disabled={!!editingUser}
              helperText={editingUser ? 'Email cannot be changed' : ''}
            />
            <FormControl size="small" fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={formState.role}
                onChange={e => setFormState(s => ({ ...s, role: e.target.value as User['role'] }))}
              >
                {ROLE_OPTIONS.filter(r => r !== 'OWNER').map(r => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!editingUser && (
              <TextField
                label="Temporary Password"
                type="password"
                value={formState.password}
                onChange={e => setFormState(s => ({ ...s, password: e.target.value }))}
                fullWidth
                required
                size="small"
                error={!!formState.password && formState.password.length < 8}
                helperText={
                  formState.password && formState.password.length < 8
                    ? 'Password must be at least 8 characters'
                    : 'User should change this on first login'
                }
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={
              !formState.firstName || !formState.lastName || !formState.email ||
              (!editingUser && (!formState.password || formState.password.length < 8))
            }
          >
            {editingUser ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?
            This will deactivate their account and revoke access.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
