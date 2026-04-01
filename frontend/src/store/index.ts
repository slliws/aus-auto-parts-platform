import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import customersReducer from './slices/customersSlice';
import partsReducer from './slices/partsSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import ordersReducer from './slices/ordersSlice';
import paymentsReducer from './slices/paymentsSlice';
import uiReducer from './slices/uiSlice';
import messagingReducer from './slices/messagingSlice';
import statisticsReducer from './slices/statisticsSlice';
import searchReducer from './slices/searchSlice';

/**
 * Redux Store Configuration
 *
 * Configures the Redux store with all application slices and middleware.
 * Includes Redux DevTools integration for development environment.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    customers: customersReducer,
    parts: partsReducer,
    vehicles: vehiclesReducer,
    orders: ordersReducer,
    payments: paymentsReducer,
    ui: uiReducer,
    messaging: messagingReducer,
    statistics: statisticsReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['auth/login/fulfilled', 'auth/refreshToken/fulfilled'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.accessToken', 'auth.refreshToken'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;