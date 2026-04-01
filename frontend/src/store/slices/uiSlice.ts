import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

/**
 * UI State Interface
 * Manages application-wide UI state (sidebar, notifications, theme, loading overlays)
 */
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number; // milliseconds, 0 = persistent
  timestamp: number;
}

interface LoadingState {
  [key: string]: boolean;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  theme: 'light' | 'dark' | 'auto';
  loadingStates: LoadingState;
  modalOpen: boolean;
  modalType: string | null;
  modalData: any;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  notifications: [],
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'auto') || 'light',
  loadingStates: {},
  modalOpen: false,
  modalType: null,
  modalData: null,
};

/**
 * UI Slice - Synchronous actions only
 * Manages UI state without async thunks
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    /**
     * Add Notification
     * Adds a new notification to the queue with auto-generated ID
     */
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        duration: action.payload.duration ?? 5000, // Default 5 seconds
      };
      state.notifications.push(notification);
    },
    
    /**
     * Remove Notification
     * Removes notification by ID
     */
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notif => notif.id !== action.payload
      );
    },
    
    /**
     * Clear All Notifications
     * Removes all notifications from queue
     */
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    /**
     * Set Theme
     * Updates application theme and persists to localStorage
     */
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    /**
     * Set Loading State
     * Sets loading state for a specific key (e.g., 'savingProfile', 'uploadingFile')
     */
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loadingStates[action.payload.key] = action.payload.loading;
    },
    
    /**
     * Clear Loading State
     * Removes a loading state key
     */
    clearLoadingState: (state, action: PayloadAction<string>) => {
      delete state.loadingStates[action.payload];
    },
    
    /**
     * Clear All Loading States
     * Resets all loading states
     */
    clearAllLoadingStates: (state) => {
      state.loadingStates = {};
    },
    
    /**
     * Open Modal
     * Opens a modal with specified type and data
     */
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modalOpen = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data || null;
    },
    
    /**
     * Close Modal
     * Closes the currently open modal and clears data
     */
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
      state.modalData = null;
    },
    
    /**
     * Update Modal Data
     * Updates modal data without closing/reopening
     */
    updateModalData: (state, action: PayloadAction<any>) => {
      state.modalData = action.payload;
    },
    
    /**
     * Reset UI State
     * Resets all UI state to initial values (except theme)
     */
    resetUIState: (state) => {
      state.sidebarOpen = initialState.sidebarOpen;
      state.sidebarCollapsed = initialState.sidebarCollapsed;
      state.notifications = [];
      state.loadingStates = {};
      state.modalOpen = false;
      state.modalType = null;
      state.modalData = null;
      // Preserve theme preference
    },
  },
});

// Actions
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setTheme,
  setLoadingState,
  clearLoadingState,
  clearAllLoadingStates,
  openModal,
  closeModal,
  updateModalData,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectNotifications = (state: RootState) => state.ui.notifications;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectLoadingStates = (state: RootState) => state.ui.loadingStates;
export const selectLoadingState = (state: RootState, key: string) => 
  state.ui.loadingStates[key] || false;
export const selectAnyLoading = (state: RootState) => 
  Object.values(state.ui.loadingStates).some(loading => loading);
export const selectModalOpen = (state: RootState) => state.ui.modalOpen;
export const selectModalType = (state: RootState) => state.ui.modalType;
export const selectModalData = (state: RootState) => state.ui.modalData;

// Helper selector to get active (non-expired) notifications
export const selectActiveNotifications = (state: RootState) => {
  const now = Date.now();
  return state.ui.notifications.filter(notif => {
    if (notif.duration === 0) return true; // Persistent notification
    return (now - notif.timestamp) < notif.duration;
  });
};

export default uiSlice.reducer;