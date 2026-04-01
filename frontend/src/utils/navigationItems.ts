/**
 * Navigation items configuration for sidebar and bottom navigation
 */

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

/**
 * Main dashboard navigation items
 */
export const dashboardNavItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/',
  },
  {
    id: 'parts',
    label: 'Parts',
    icon: 'inventory',
    path: '/parts',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'people',
    path: '/customers',
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'shopping_cart',
    path: '/orders',
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: 'directions_car',
    path: '/vehicles',
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: 'request_quote',
    path: '/quotes',
  },
   {
     id: 'analytics',
     label: 'Analytics',
     icon: 'analytics',
     path: '/analytics',
   },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'assessment',
    path: '/reports',
  },
];

/**
 * Sidebar navigation items (legacy - marketplace focused)
 */
export const sidebarItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    path: '/',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'marketplace',
    path: '/marketplace',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: 'messages',
    path: '/messages',
    badge: 0, // Badge count for unread messages
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: 'favorites',
    path: '/favorites',
  },
  {
    id: 'search',
    label: 'Search',
    icon: 'search',
    path: '/search',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'profile',
    path: '/profile',
  },
];

/**
 * Bottom navigation items (mobile)
 * Simplified version with most commonly used items
 */
export const bottomNavItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    path: '/',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'marketplace',
    path: '/marketplace',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: 'messages',
    path: '/messages',
    badge: 0,
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: 'favorites',
    path: '/favorites',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: 'profile',
    path: '/profile',
  },
];

export default {
  dashboardNavItems,
  sidebarItems,
  bottomNavItems,
};