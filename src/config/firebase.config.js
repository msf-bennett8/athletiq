// src/config/firebase.config.js
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Environment-based configuration with proper error handling
const getFirebaseConfig = () => {
  const baseConfig = {
    apiKey: "AIzaSyCGlmciUps6QR1VjCjOKYcqBoJrwVXJdeQ",
    authDomain: "athletiq-37e35.firebaseapp.com",
    projectId: "athletiq-37e35",
    storageBucket: "athletiq-37e35.firebasestorage.app",
    messagingSenderId: "497434151930"
  };

  // Platform-specific configurations - CORRECTED App IDs from Firebase Console
  if (Platform.OS === 'web') {
    return {
      ...baseConfig,
      appId: "1:497434151930:web:eed4da28416da9adf6f243", // Corrected from Console
      measurementId: "G-NY2FMJHHHD"
    };
  } else if (Platform.OS === 'ios') {
    return {
      ...baseConfig,
      appId: "1:497434151930:ios:dd0a36b3faec520cf6f243" // Corrected from Console
    };
  } else {
    return {
      ...baseConfig,
      appId: "1:497434151930:android:b3084b7d9d3df3ccf6f243" // This one was already correct
    };
  }
};

let firebaseApp, auth, db, storage;

try {
  if (Platform.OS === 'web') {
    console.log('🌐 Initializing Firebase Web SDK...');
    
    // Use static imports instead of require for better bundling
    const { initializeApp, getApps } = require('firebase/app');
    const { getAuth, connectAuthEmulator } = require('firebase/auth');
    const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
    const { getStorage, connectStorageEmulator } = require('firebase/storage');

    const firebaseConfig = getFirebaseConfig();
    
    // Initialize Firebase (prevent multiple initialization)
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
      console.log('✅ Firebase app created with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId
      });
    } else {
      firebaseApp = getApps()[0];
      console.log('✅ Using existing Firebase app');
    }

    // Initialize services
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);

    // Set up auth persistence
    auth.setPersistence = async (persistence) => {
      try {
        const { setPersistence, browserLocalPersistence } = require('firebase/auth');
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn('Auth persistence setup failed:', error.message);
      }
    };

    console.log('✅ Firebase Web SDK initialized successfully');

  } else {
    console.log('📱 Initializing React Native Firebase...');
    
    const app = require('@react-native-firebase/app').default;
    const app = initializeApp(firebaseConfig);
    const authModule = require('@react-native-firebase/auth').default;
    const firestoreModule = require('@react-native-firebase/firestore').default;
    const storageModule = require('@react-native-firebase/storage').default;

    firebaseApp = app();
    auth = authModule();
    db = firestoreModule();
    storage = storageModule();

    // Configure Firestore settings for better offline support
    try {
      db.settings({
        persistence: true,
        cacheSizeBytes: firestoreModule.CACHE_SIZE_UNLIMITED,
      }).then(() => {
        console.log('📱 Firestore offline persistence configured');
      }).catch((error) => {
        if (!error.message.includes('already been set')) {
          console.warn('⚠️ Firestore settings warning:', error.message);
        }
      });
    } catch (error) {
      console.warn('⚠️ Firestore settings error:', error.message);
    }

    console.log('✅ React Native Firebase initialized successfully');
  }

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code
  });
  
  // Provide fallback null values to prevent app crashes
  firebaseApp = null;
  auth = null;
  db = null;
  storage = null;
}

// Enhanced health check function
export const checkFirebaseHealth = async () => {
  try {
    if (!db) {
      return { healthy: false, error: 'Firebase not initialized' };
    }

    if (Platform.OS === 'web') {
      const { collection, limit, getDocs } = require('firebase/firestore');
      const testRef = collection(db, '_healthcheck');
      await getDocs(limit(testRef, 1));
    } else {
      await db.collection('_healthcheck').limit(1).get();
    }

    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

// Connection status checker with timeout
export const checkFirebaseConnection = async (timeoutMs = 10000) => {
  try {
    const healthCheck = await Promise.race([
      checkFirebaseHealth(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      )
    ]);

    return healthCheck.healthy;
  } catch (error) {
    console.warn('Firebase connection check failed:', error.message);
    return false;
  }
};

// Debug function to check Firebase status
export const debugFirebaseStatus = () => {
  console.log('🔍 Firebase Debug Status:', {
    platform: Platform.OS,
    firebaseApp: !!firebaseApp,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    config: getFirebaseConfig()
  });
};

// Export Firebase instances
export { firebaseApp, auth, db, storage };
export default firebaseApp;