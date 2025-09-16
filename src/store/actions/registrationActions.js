// src/store/actions/registrationActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import FirebaseService from '../../services/FirebaseService';
import * as GoogleSignIn from '@react-native-google-signin/google-signin';
import { 
  setGoogleAuthLoading, 
  setGoogleAuthData, 
  setGoogleAuthError,
  setPhoneAuthLoading,
  setPhoneVerificationId,
  setPhoneAuthError,
  updateUserData,
  setRegistrationError
} from '../slices/registrationSlice';

// Google Authentication Actions
export const initializeGoogleSignIn = createAsyncThunk(
  'registration/initializeGoogleSignIn',
  async (_, { rejectWithValue }) => {
    try {
      await GoogleSignIn.configure({
        webClientId: '497434151930-oq6o04sgmms52002jj4junb902ov29eo.apps.googleusercontent.com', // From your google-services.json
        offlineAccess: true,
      });
      
      return { initialized: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signInWithGoogle = createAsyncThunk(
  'registration/signInWithGoogle',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setGoogleAuthLoading(true));
      
      // Check if Google Play Services are available
      await GoogleSignIn.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignIn.signIn();
      
      // Get additional user data
      const googleUser = {
        id: userInfo.user.id,
        email: userInfo.user.email,
        givenName: userInfo.user.givenName,
        familyName: userInfo.user.familyName,
        photo: userInfo.user.photo,
        name: userInfo.user.name
      };
      
      // Update Redux store with Google auth data
      dispatch(setGoogleAuthData({
        idToken: userInfo.idToken,
        accessToken: userInfo.accessToken,
        user: googleUser
      }));
      
      // Pre-fill user data
      dispatch(updateUserData({
        email: googleUser.email,
        firstName: googleUser.givenName || '',
        lastName: googleUser.familyName || '',
        profileImage: googleUser.photo || null
      }));
      
      return {
        success: true,
        user: googleUser,
        tokens: {
          idToken: userInfo.idToken,
          accessToken: userInfo.accessToken
        }
      };
      
    } catch (error) {
      dispatch(setGoogleAuthError(error.message));
      
      let errorMessage = 'Google sign-in failed';
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'Sign-in is already in progress';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Google Play Services not available';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const signOutGoogle = createAsyncThunk(
  'registration/signOutGoogle',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await GoogleSignIn.signOut();
      
      // Clear Google auth data from store
      dispatch(clearGoogleAuthData());
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Phone Authentication Actions
export const sendPhoneVerification = createAsyncThunk(
  'registration/sendPhoneVerification',
  async (phoneNumber, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setPhoneAuthLoading(true));
      
      // Validate phone number format
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number');
      }
      
      // Format phone number with country code if needed
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
      
      // Send verification code via Firebase
      const confirmation = await FirebaseService.sendPhoneVerification(formattedPhone);
      
      dispatch(setPhoneVerificationId(confirmation.verificationId));
      
      return {
        success: true,
        verificationId: confirmation.verificationId,
        phoneNumber: formattedPhone
      };
      
    } catch (error) {
      dispatch(setPhoneAuthError(error.message));
      
      let errorMessage = 'Failed to send verification code';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyPhoneCode = createAsyncThunk(
  'registration/verifyPhoneCode',
  async ({ verificationId, verificationCode }, { dispatch, rejectWithValue }) => {
    try {
      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit verification code');
      }
      
      // Verify the code with Firebase
      const credential = await FirebaseService.verifyPhoneCode(verificationId, verificationCode);
      
      if (credential.user) {
        // Update user data with phone information
        dispatch(updateUserData({
          phoneNumber: credential.user.phoneNumber,
          phoneVerified: true
        }));
        
        return {
          success: true,
          user: credential.user,
          phoneNumber: credential.user.phoneNumber
        };
      }
      
      throw new Error('Verification failed');
      
    } catch (error) {
      dispatch(setPhoneAuthError(error.message));
      
      let errorMessage = 'Code verification failed';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Email Registration Actions
export const registerWithEmail = createAsyncThunk(
  'registration/registerWithEmail',
  async (userData, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const { authMethod } = state.registration;
      
      if (authMethod !== 'email') {
        throw new Error('Invalid authentication method for email registration');
      }
      
      // Validate required fields
      const requiredFields = ['email', 'password', 'firstName', 'lastName'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Register user through Firebase service
      const result = await FirebaseService.registerUser({
        ...userData,
        authMethod: 'email'
      });
      
      return result;
      
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Complete Registration Actions
export const completeRegistration = createAsyncThunk(
  'registration/completeRegistration',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const { userData, authMethod, googleAuthData, phoneAuthData } = state.registration;
      const { isOnline } = state.network;
      
      // Prepare complete user data based on auth method
      let completeUserData = { ...userData };
      
      switch (authMethod) {
        case 'google':
          if (!googleAuthData.user) {
            throw new Error('Google authentication data not available');
          }
          completeUserData = {
            ...completeUserData,
            googleId: googleAuthData.user.id,
            idToken: googleAuthData.idToken,
            accessToken: googleAuthData.accessToken,
            emailVerified: true
          };
          break;
          
        case 'phone':
          if (!phoneAuthData.verificationId) {
            throw new Error('Phone verification not completed');
          }
          completeUserData = {
            ...completeUserData,
            phoneVerified: true
          };
          break;
          
        case 'email':
          if (!userData.password) {
            throw new Error('Password is required for email registration');
          }
          break;
          
        default:
          throw new Error('No authentication method selected');
      }
      
      // Add registration metadata
      completeUserData.authMethod = authMethod;
      completeUserData.registeredAt = new Date().toISOString();
      completeUserData.isOnlineRegistration = isOnline;
      
      // Register user
      const result = await FirebaseService.registerUser(completeUserData);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return {
        ...result,
        userData: completeUserData
      };
      
    } catch (error) {
      dispatch(setRegistrationError(error.message));
      return rejectWithValue(error.message);
    }
  }
);

// Validation Actions
export const validateEmail = createAsyncThunk(
  'registration/validateEmail',
  async (email, { rejectWithValue }) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check if email already exists (if online)
      const emailExists = await FirebaseService.checkEmailExistsInFirebase(email);
      if (emailExists) {
        throw new Error('This email is already registered');
      }
      
      return { isValid: true, email };
      
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const validatePassword = createAsyncThunk(
  'registration/validatePassword',
  async ({ password, confirmPassword }, { rejectWithValue }) => {
    try {
      if (!password) {
        throw new Error('Password is required');
      }
      
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (!/(?=.*[a-z])/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      
      if (!/(?=.*[A-Z])/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      
      if (!/(?=.*\d)/.test(password)) {
        throw new Error('Password must contain at least one number');
      }
      
      if (confirmPassword && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      return { isValid: true };
      
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const validateUsername = createAsyncThunk(
  'registration/validateUsername',
  async (username, { rejectWithValue }) => {
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      
      if (username.length > 20) {
        throw new Error('Username must be less than 20 characters');
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }
      
      // Check if username already exists (if online)
      const usernameExists = await FirebaseService.checkUsernameExists(username);
      if (usernameExists) {
        throw new Error('This username is already taken');
      }
      
      return { isValid: true, username };
      
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Sync Actions
export const triggerOfflineSync = createAsyncThunk(
  'registration/triggerOfflineSync',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { isOnline } = state.network;
      
      if (!isOnline) {
        throw new Error('Device is offline. Cannot sync at this time.');
      }
      
      // Trigger sync of offline registrations
      const syncResult = await FirebaseService.syncOfflineRegistrationsToFirebase();
      
      // Also process any queued operations
      const queueResult = await FirebaseService.processOfflineQueue();
      
      return {
        syncResult,
        queueResult,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Cleanup Actions
export const clearRegistrationData = createAsyncThunk(
  'registration/clearRegistrationData',
  async (_, { dispatch }) => {
    try {
      // Sign out from Google if signed in
      if (await GoogleSignIn.isSignedIn()) {
        await GoogleSignIn.signOut();
      }
      
      // Clear any Firebase auth state
      if (FirebaseService.auth.currentUser) {
        await FirebaseService.auth.signOut();
      }
      
      return { success: true };
      
    } catch (error) {
      console.warn('Error during registration cleanup:', error);
      return { success: true }; // Don't fail cleanup
    }
  }
);