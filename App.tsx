import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch } from 'react-redux';
import { PaperProvider, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox } from 'react-native';

// Use require() for JavaScript files to avoid import issues
const { store } = require('./src/store/store');
const AppNavigator = require('./src/navigation/AppNavigator').default || require('./src/navigation/AppNavigator');
const OfflineSyncManager = require('./src/components/offlinemanager/OfflineSyncManager').default || require('./src/components/offlinemanager/OfflineSyncManager');
const { initializeNetworkMonitoring } = require('./src/store/slices/networkSlice');
const { initializeGoogleSignIn } = require('./src/store/actions/registrationActions');
const FirebaseService = require('./src/services/FirebaseService').default || require('./src/services/FirebaseService');
const { initializeFirebaseApp, setupAutoSyncRetry } = require('./src/config/firebaseInit');

// Ignore specific warnings
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted',
]);

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize network monitoring
        console.log('Initializing network monitoring...');
        const networkResult = await dispatch(initializeNetworkMonitoring());
        if (networkResult.type.endsWith('/fulfilled')) {
          console.log('Network monitoring initialized');
        }
        
        // Initialize Firebase service
        console.log('Initializing Firebase service...');
        await FirebaseService.initialize();
        
        // Initialize Google Sign-In
        console.log('Initializing Google Sign-In...');
        const googleSignInResult = await dispatch(initializeGoogleSignIn());
        if (googleSignInResult.type.endsWith('/fulfilled')) {
          console.log('Google Sign-In initialized');
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
        // Don't throw error - let app continue in offline mode
      }
    };

    initializeApp();
  }, [dispatch]);

  return <>{children}</>;
};

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
  },
};

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Initializing...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

export default function App(): React.ReactElement {
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);
  const [firebaseMode, setFirebaseMode] = useState<string>('offline');
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    let retryInterval: NodeJS.Timeout | null = null;
    
    const initializeApp = async (): Promise<void> => {
      console.log('Starting app initialization...');
      
      try {
        // Initialize Firebase with error handling
        console.log('Initializing Firebase app...');
        const firebaseResult = await initializeFirebaseApp();
        
        if (firebaseResult && firebaseResult.success) {
          setFirebaseMode(firebaseResult.mode);
          console.log(`Firebase initialized in ${firebaseResult.mode} mode`);
          
          // Set up auto-retry for syncing if online
          if (firebaseResult.mode === 'online') {
            retryInterval = setupAutoSyncRetry();
          }
        } else {
          console.warn('Firebase initialization failed, continuing in offline mode');
          setFirebaseMode('offline');
          setInitializationError(firebaseResult?.error || 'Unknown error');
        }
        
        // Always set as ready - app works offline
        setIsFirebaseReady(true);
        
      } catch (error) {
        console.error('App initialization error:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setFirebaseMode('offline');
        setIsFirebaseReady(true); // Still allow app to work offline
      }
    };

    // Add delay to ensure all modules are loaded
    const timer = setTimeout(initializeApp, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, []);

  // Show loading screen while initializing
  if (!isFirebaseReady) {
    return (
      <PaperProvider theme={theme}>
        <StatusBar barStyle="default" />
        <LoadingScreen message="Setting up Athletr..." />
      </PaperProvider>
    );
  }

  // Wrap everything in error boundary-like logic
  try {
    return (
      <Provider store={store}>
        <AppInitializer>
          <PaperProvider theme={theme}>
            <NavigationContainer>
              <StatusBar barStyle="default" />
              
              {/* Offline Sync Manager - handles automatic syncing */}
              <OfflineSyncManager />
              
              {/* Main App Navigator */}
              <AppNavigator />
              
              {/* Show connection status indicator if needed */}
              {firebaseMode === 'offline' && __DEV__ && (
                <View style={styles.offlineIndicator}>
                  <Text style={styles.offlineText}>
                    Running in offline mode
                    {initializationError && ` (${initializationError})`}
                  </Text>
                </View>
              )}
            </NavigationContainer>
          </PaperProvider>
        </AppInitializer>
      </Provider>
    );
  } catch (error) {
    // Fallback UI if main app fails
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Athletr</Text>
        <Text style={styles.errorText}>Starting up...</Text>
        <Text style={styles.errorSubtext}>Please wait a moment</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  offlineText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
  },
});