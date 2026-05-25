import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  DirectionsCar as DirectionsCarIcon,
  RequestQuote as RequestQuoteIcon,
  Assessment as AssessmentIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';

const DRAWER_WIDTH = 240;

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: JSX.Element;
  badge?: number;
  /** Only show for these roles (undefined = show to all) */
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { id: 'parts', label: 'Parts', path: '/parts', icon: <InventoryIcon /> },
  { id: 'customers', label: 'Customers', path: '/customers', icon: <PeopleIcon /> },
  { id: 'orders', label: 'Orders', path: '/orders', icon: <ShoppingCartIcon /> },
  { id: 'vehicles', label: 'Vehicles', path: '/vehicles', icon: <DirectionsCarIcon /> },
  { id: 'quotes', label: 'Quotes', path: '/quotes', icon: <RequestQuoteIcon /> },
  { id: 'reports', label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  {
    id: 'users',
    label: 'Team',
    path: '/users',
    icon: <ManageAccountsIcon />,
    roles: ['OWNER', 'ADMIN'],
  },
];

/**
 * MainLayout Component
 * Provides the main application layout with persistent navigation
 * - AppBar with branding and user menu
 * - Responsive drawer navigation
 * - Breadcrumb navigation
 * - Footer with version info
 */
const MainLayout = () => {
  const theme = useTheme();
  // Ensure breakpoints are available (they should be from our ThemeProvider fix)
  // The 'md' key matches both MUI default and our custom breakpoints (768px)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const user = useSelector((state: RootState) => state.auth.user);
  // Tenant info might need to be fetched separately or added to auth state
  const tenant = useSelector((state: RootState) => (state.auth as any).tenant);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleUserMenuClose();
  };

  // Filter nav items by user role
  const visibleNavItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes((user as any)?.role ?? '');
  });

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Auto Parts
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{ color: isActive ? 'primary.main' : 'inherit' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Australian Auto Parts Platform
          </Typography>
          {tenant && (
            <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
              {tenant.name}
            </Typography>
          )}
          <IconButton
            color="inherit"
            onClick={handleUserMenuOpen}
            aria-label="user menu"
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.email || 'User'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleUserMenuClose} component={Link} to="/profile">
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
        
        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 'auto',
            pt: 4,
            pb: 2,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">
            Australian Auto Parts Platform v1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
