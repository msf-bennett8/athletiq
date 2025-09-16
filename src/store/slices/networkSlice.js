// src/store/slices/networkSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import FirebaseService from '../../services/FirebaseService';

// Async thunks
export const initializeNetworkMonitoring = createAsyncThunk(
  'network/initializeMonitoring',
  async (_, { dispatch }) => {
    try {
      // Get initial network state
      const networkState = await NetInfo.fetch();
      
      const initialState = {
        isConnected: networkState.isConnected || false,
        isInternetReachable: networkState.isInternetReachable || false,
        type: networkState.type,
        connectionQuality: getConnectionQuality(networkState)
      };
      
      // Set up network listener
      const unsubscribe = NetInfo.addEventListener((state) => {
        dispatch(updateNetworkState({
          isConnected: state.isConnected || false,
          isInternetReachable: state.isInternetReachable || false,
          type: state.type,
          connectionQuality: getConnectionQuality(state)
        }));
      });
      
      return { initialState, unsubscribe };
    } catch (error) {
      throw error;
    }
  }
);

export const checkConnectivity = createAsyncThunk(
  'network/checkConnectivity',
  async () => {
    try {
      const networkState = await NetInfo.fetch();
      return {
        isConnected: networkState.isConnected || false,
        isInternetReachable: networkState.isInternetReachable || false,
        type: networkState.type,
        connectionQuality: getConnectionQuality(networkState)
      };
    } catch (error) {
      throw error;
    }
  }
);

export const testFirebaseConnection = createAsyncThunk(
  'network/testFirebaseConnection',
  async () => {
    try {
      // Test Firebase connectivity
      const result = await FirebaseService.testConnectionWithTimeout(5000);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
);

// Helper function to determine connection quality
function getConnectionQuality(state) {
  if (!state.isConnected || !state.isInternetReachable) {
    return 'offline';
  }

  switch (state.type) {
    case 'wifi':
      return 'excellent';
    case 'cellular':
      if (state.details && state.details.cellularGeneration) {
        switch (state.details.cellularGeneration) {
          case '5g':
          case '4g':
            return 'good';
          case '3g':
            return 'fair';
          case '2g':
            return 'poor';
          default:
            return 'fair';
        }
      }
      return 'good';
    case 'ethernet':
      return 'excellent';
    case 'other':
    case 'unknown':
    default:
      return 'unknown';
  }
}

// Initial state
const initialState = {
  // Connection status
  isConnected: false,
  isInternetReachable: false,
  type: null,
  connectionQuality: 'unknown',
  
  // Firebase connectivity
  firebaseConnected: false,
  firebaseError: null,
  lastFirebaseCheck: null,
  
  // Monitoring state
  isInitialized: false,
  isMonitoring: false,
  lastUpdated: null,
  
  // Connection history
  connectionHistory: [],
  maxHistoryLength: 10,
  
  // Feature availability
  canUseOnlineFeatures: false,
  canUseAuth: false,
  canSync: false,
  
  // Error tracking
  errors: [],
  warnings: []
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    updateNetworkState: (state, action) => {
      const newState = action.payload;
      const previousState = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        connectionQuality: state.connectionQuality
      };
      
      // Update connection state
      state.isConnected = newState.isConnected;
      state.isInternetReachable = newState.isInternetReachable;
      state.type = newState.type;
      state.connectionQuality = newState.connectionQuality;
      state.lastUpdated = new Date().toISOString();
      
      // Update feature availability
      state.canUseOnlineFeatures = newState.isConnected && newState.isInternetReachable;
      state.canUseAuth = state.canUseOnlineFeatures;
      state.canSync = state.canUseOnlineFeatures;
      
      // Add to connection history if state changed
      if (
        previousState.isConnected !== newState.isConnected ||
        previousState.connectionQuality !== newState.connectionQuality
      ) {
        state.connectionHistory.unshift({
          ...newState,
          timestamp: new Date().toISOString(),
          previousState
        });
        
        // Keep history within limits
        if (state.connectionHistory.length > state.maxHistoryLength) {
          state.connectionHistory = state.connectionHistory.slice(0, state.maxHistoryLength);
        }
      }
      
      // Clear warnings when coming back online
      if (newState.isConnected && !previousState.isConnected) {
        state.warnings = [];
      }
      
      // Add warning when going offline
      if (!newState.isConnected && previousState.isConnected) {
        state.warnings.push({
          type: 'connection_lost',
          message: 'Connection lost. Some features may be unavailable.',
          timestamp: new Date().toISOString()
        });
      }
    },
    
    setFirebaseConnectionStatus: (state, action) => {
      const { connected, error } = action.payload;
      state.firebaseConnected = connected;
      state.firebaseError = error;
      state.lastFirebaseCheck = new Date().toISOString();
      
      if (!connected && error) {
        state.errors.push({
          type: 'firebase_connection',
          message: error,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    
    setMonitoring: (state, action) => {
      state.isMonitoring = action.payload;
    },
    
    addError: (state, action) => {
      const error = {
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      state.errors.push(error);
      
      // Keep only last 20 errors
      if (state.errors.length > 20) {
        state.errors = state.errors.slice(-20);
      }
    },
    
    addWarning: (state, action) => {
      const warning = {
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      state.warnings.push(warning);
      
      // Keep only last 10 warnings
      if (state.warnings.length > 10) {
        state.warnings = state.warnings.slice(-10);
      }
    },
    
    clearErrors: (state) => {
      state.errors = [];
    },
    
    clearWarnings: (state) => {
      state.warnings = [];
    },
    
    removeError: (state, action) => {
      const errorIndex = action.payload;
      if (errorIndex >= 0 && errorIndex < state.errors.length) {
        state.errors.splice(errorIndex, 1);
      }
    },
    
    removeWarning: (state, action) => {
      const warningIndex = action.payload;
      if (warningIndex >= 0 && warningIndex < state.warnings.length) {
        state.warnings.splice(warningIndex, 1);
      }
    },
    
    updateFeatureAvailability: (state, action) => {
      const { canUseOnlineFeatures, canUseAuth, canSync } = action.payload;
      state.canUseOnlineFeatures = canUseOnlineFeatures;
      state.canUseAuth = canUseAuth;
      state.canSync = canSync;
    },
    
    resetNetworkState: (state) => {
      return { ...initialState };
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Initialize network monitoring
      .addCase(initializeNetworkMonitoring.pending, (state) => {
        state.isInitialized = false;
      })
      .addCase(initializeNetworkMonitoring.fulfilled, (state, action) => {
        const { initialState: netState } = action.payload;
        state.isConnected = netState.isConnected;
        state.isInternetReachable = netState.isInternetReachable;
        state.type = netState.type;
        state.connectionQuality = netState.connectionQuality;
        state.canUseOnlineFeatures = netState.isConnected && netState.isInternetReachable;
        state.canUseAuth = state.canUseOnlineFeatures;
        state.canSync = state.canUseOnlineFeatures;
        state.isInitialized = true;
        state.isMonitoring = true;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(initializeNetworkMonitoring.rejected, (state, action) => {
        state.isInitialized = false;
        state.errors.push({
          type: 'initialization_error',
          message: action.error.message,
          timestamp: new Date().toISOString()
        });
      })
      
      // Check connectivity
      .addCase(checkConnectivity.fulfilled, (state, action) => {
        const newState = action.payload;
        state.isConnected = newState.isConnected;
        state.isInternetReachable = newState.isInternetReachable;
        state.type = newState.type;
        state.connectionQuality = newState.connectionQuality;
        state.canUseOnlineFeatures = newState.isConnected && newState.isInternetReachable;
        state.canUseAuth = state.canUseOnlineFeatures;
        state.canSync = state.canUseOnlineFeatures;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(checkConnectivity.rejected, (state, action) => {
        state.errors.push({
          type: 'connectivity_check_error',
          message: action.error.message,
          timestamp: new Date().toISOString()
        });
      })
      
      // Test Firebase connection
      .addCase(testFirebaseConnection.fulfilled, (state, action) => {
        state.firebaseConnected = action.payload.success;
        state.firebaseError = action.payload.error || null;
        state.lastFirebaseCheck = new Date().toISOString();
        
        if (!action.payload.success) {
          state.errors.push({
            type: 'firebase_test_failed',
            message: action.payload.error,
            timestamp: new Date().toISOString()
          });
        }
      });
  }
});

// Export actions
export const {
  updateNetworkState,
  setFirebaseConnectionStatus,
  setInitialized,
  setMonitoring,
  addError,
  addWarning,
  clearErrors,
  clearWarnings,
  removeError,
  removeWarning,
  updateFeatureAvailability,
  resetNetworkState
} = networkSlice.actions;

// Selectors
export const selectNetwork = (state) => state.network;
export const selectIsOnline = (state) => state.network.isConnected && state.network.isInternetReachable;
export const selectCanUseOnlineFeatures = (state) => state.network.canUseOnlineFeatures;
export const selectCanUseAuth = (state) => state.network.canUseAuth;
export const selectCanSync = (state) => state.network.canSync;
export const selectConnectionQuality = (state) => state.network.connectionQuality;
export const selectNetworkType = (state) => state.network.type;
export const selectFirebaseConnected = (state) => state.network.firebaseConnected;
export const selectNetworkErrors = (state) => state.network.errors;
export const selectNetworkWarnings = (state) => state.network.warnings;
export const selectConnectionHistory = (state) => state.network.connectionHistory;
export const selectNetworkInitialized = (state) => state.network.isInitialized;

// Computed selectors
export const selectConnectionStatus = (state) => {
  const { isConnected, isInternetReachable, connectionQuality, isInitialized } = state.network;
  
  if (!isInitialized) {
    return 'checking';
  }
  
  if (!isConnected) {
    return 'offline';
  }
  
  if (!isInternetReachable) {
    return 'no_internet';
  }
  
  return connectionQuality;
};

export const selectShouldShowOfflineWarning = (state) => {
  const { isConnected, isInternetReachable, isInitialized } = state.network;
  return isInitialized && (!isConnected || !isInternetReachable);
};

export const selectNetworkStatusMessage = (state) => {
  const status = selectConnectionStatus(state);
  
  switch (status) {
    case 'checking':
      return 'Checking connection...';
    case 'offline':
      return 'No network connection';
    case 'no_internet':
      return 'Connected but no internet access';
    case 'excellent':
      return 'Excellent connection';
    case 'good':
      return 'Good connection';
    case 'fair':
      return 'Fair connection';
    case 'poor':
      return 'Poor connection';
    case 'unknown':
    default:
      return 'Connected';
  }
};

export const selectHasRecentConnectionIssues = (state) => {
  const { connectionHistory } = state.network;
  const recentHistory = connectionHistory.slice(0, 5);
  
  return recentHistory.some(entry => 
    !entry.isConnected || !entry.isInternetReachable
  );
};

export default networkSlice.reducer;