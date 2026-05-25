import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import MainLayout from '../components/templates/MainLayout';

// Lazy load page components for code splitting
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const PartsPage = lazy(() => import('../pages/PartsPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const MarketplacePage = lazy(() => import('../pages/MarketplacePage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const MessagesPage = lazy(() => import('../pages/MessagesPage'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Customer management pages
const CustomersPage = lazy(() => import('../pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('../pages/CustomerDetailPage'));

// Order pages
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/OrderDetailPage'));

// Vehicle pages
const VehiclesPage = lazy(() => import('../pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('../pages/VehicleDetailPage'));

// Other feature pages
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const QuotesPage = lazy(() => import('../pages/QuotesPage'));
const QuoteDetailPage = lazy(() => import('../pages/QuoteDetailPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));

// Team / User management
const UsersPage = lazy(() => import('../pages/UsersPage'));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#65676b'
  }}>
    Loading...
  </div>
);

/**
 * AppRoutes Component
 * Defines all application routes with lazy loading and route protection
 * Protected routes are wrapped in MainLayout for consistent navigation
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Protected Routes with MainLayout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Main dashboard routes */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/parts" element={<PartsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />

          {/* Orders */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />

          {/* Vehicles */}
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />

          {/* Analytics & Reports */}
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Quotes */}
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />

          {/* Team / User Management */}
          <Route path="/users" element={<UsersPage />} />

          {/* Legacy marketplace routes */}
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:id" element={<ProductDetailPage />} />
          <Route path="/marketplace/category/:categoryId" element={<MarketplacePage />} />

          {/* Other protected routes */}
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
