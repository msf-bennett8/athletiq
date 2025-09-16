import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch } from 'react-redux';
import { PaperProvider, MD3LightTheme, ActivityIndicator } from 'react-native-paper';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineSyncManager from './src/components/offlinemanager/OfflineSyncManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox } from 'react-native';
import { initializeNetworkMonitoring } from './src/store/slices/networkSlice';
import { initializeGoogleSignIn } from './src/store/actions/registrationActions';
import FirebaseService from './src/services/FirebaseService';

// Import Firebase initialization
import { initializeFirebaseApp, setupAutoSyncRetry } from './src/config/firebaseInit';

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
        const networkResult = await dispatch(initializeNetworkMonitoring());
        if (networkResult.type.endsWith('/fulfilled')) {
          console.log('✅ Network monitoring initialized');
        }
        
        // Initialize Firebase service
        await FirebaseService.initialize();
        
        // Initialize Google Sign-In
        const googleSignInResult = await dispatch(initializeGoogleSignIn());
        if (googleSignInResult.type.endsWith('/fulfilled')) {
          console.log('✅ Google Sign-In initialized');
        }
        
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization error:', error);
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
      console.log('🚀 Starting app initialization...');
      
      try {
        // Initialize Firebase
        const firebaseResult = await initializeFirebaseApp();
        
        if (firebaseResult.success) {
          setFirebaseMode(firebaseResult.mode);
          console.log(`✅ Firebase initialized in ${firebaseResult.mode} mode`);
          
          // Set up auto-retry for syncing if online
          if (firebaseResult.mode === 'online') {
            retryInterval = setupAutoSyncRetry();
          }
        } else {
          console.warn('⚠️ Firebase initialization failed, continuing in offline mode');
          setFirebaseMode('offline');
          setInitializationError(firebaseResult.error || 'Unknown error');
        }
        
        // Always set as ready - app works offline
        setIsFirebaseReady(true);
        
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        setFirebaseMode('offline');
        setIsFirebaseReady(true); // Still allow app to work offline
      }
    };

    initializeApp();

    // Cleanup
    return () => {
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, []);

  // Show loading screen while initializing
  if (!isFirebaseReady) {
    return (
      <PaperProvider theme={theme}>
        <LoadingScreen message="Setting up Athletr..." />
      </PaperProvider>
    );
  }

  return (
    <Provider store={store}>
      <AppInitializer>
        <PaperProvider theme={theme}>
          <NavigationContainer>
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
          <StatusBar barStyle="default" />
        </PaperProvider>
      </AppInitializer>
    </Provider>
  );
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
});