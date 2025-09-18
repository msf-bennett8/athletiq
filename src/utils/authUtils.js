// src/utils/authUtils.js
import { Platform, Alert } from 'react-native';
import * as GoogleSignIn from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase.config';

/**
 * Authentication utility functions
 * Handles Google OAuth, phone authentication, and validation
 */

// Google Sign-In Configuration
export const configureGoogleSignIn = () => {
  GoogleSignIn.configure({
    iosClientId: '497434151930-f5r2lef6pvlh5ptjlo08if5cb1adceop.apps.googleusercontent.com',
    androidClientId: '497434151930-3vme1r2sicp5vhve5450nke3evaiq2nf.apps.googleusercontent.com', // Your Android OAuth2 ID
    webClientId: '497434151930-oq6o04sgmms52002jj4junb902ov29eo.apps.googleusercontent.com', // Your Web OAuth2 ID
    offlineAccess: true,
    hostedDomain: '', // Optional
    forceCodeForRefreshToken: true,
  });
};

// Google Authentication Functions
export const initializeGoogleAuth = async () => {
  try {
    configureGoogleSignIn();
    
    // Check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      await GoogleSignIn.hasPlayServices();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Google Auth initialization error:', error);
    return { 
      success: false, 
      error: getGoogleAuthError(error) 
    };
  }
};

export const signInWithGoogle = async () => {
  try {
    // Check if user is already signed in
    const isSignedIn = await GoogleSignIn.isSignedIn();
    if (isSignedIn) {
      await GoogleSignIn.signOut();
    }
    
    // Perform sign-in
    const userInfo = await GoogleSignIn.signIn();
    
    // Get ID token for Firebase
    const { idToken } = userInfo;
    
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }
    
    return {
      success: true,
      user: userInfo.user,
      idToken,
      accessToken: userInfo.accessToken
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { 
      success: false, 
      error: getGoogleAuthError(error) 
    };
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignIn.signOut();
    return { success: true };
  } catch (error) {
    console.error('Google sign-out error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignIn.getCurrentUser();
    return userInfo;
  } catch (error) {
    console.error('Get current Google user error:', error);
    return null;
  }
};

// Phone Authentication Functions
export const sendPhoneVerification = async (phoneNumber) => {
  try {
    // Validate phone number format
    const cleanPhoneNumber = cleanPhoneNumber(phoneNumber);
    if (!isValidPhoneNumber(cleanPhoneNumber)) {
      throw new Error('Invalid phone number format');
    }
    
    // Firebase phone verification
    let verificationId;
    
    if (Platform.OS === 'web') {
      const { RecaptchaVerifier, signInWithPhoneNumber } = require('firebase/auth');
      
      // Create recaptcha verifier
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha verified');
        }
      }, auth);
      
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, cleanPhoneNumber, appVerifier);
      verificationId = confirmationResult.verificationId;
    } else {
      // React Native Firebase
      const confirmation = await auth().signInWithPhoneNumber(cleanPhoneNumber);
      verificationId = confirmation.verificationId;
    }
    
    return {
      success: true,
      verificationId,
      phoneNumber: cleanPhoneNumber
    };
  } catch (error) {
    console.error('Phone verification error:', error);
    return { 
      success: false, 
      error: getPhoneAuthError(error) 
    };
  }
};

export const verifyPhoneCode = async (verificationId, code) => {
  try {
    if (!verificationId) {
      throw new Error('No verification ID provided');
    }
    
    if (!code || code.length !== 6) {
      throw new Error('Invalid verification code');
    }
    
    let credential;
    
    if (Platform.OS === 'web') {
      const { PhoneAuthProvider, signInWithCredential } = require('firebase/auth');
      credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      
      return {
        success: true,
        user: result.user,
        phoneNumber: result.user.phoneNumber
      };
    } else {
      // React Native Firebase
      const confirmation = auth().confirmationResult;
      credential = auth.PhoneAuthProvider.credential(verificationId, code);
      const result = await auth().signInWithCredential(credential);
      
      return {
        success: true,
        user: result.user,
        phoneNumber: result.user.phoneNumber
      };
    }
  } catch (error) {
    console.error('Phone code verification error:', error);
    return { 
      success: false, 
      error: getPhoneAuthError(error) 
    };
  }
};

// Validation Functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password, confirmPassword = null) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (@$!%*?&)' };
  }
  
  if (confirmPassword && password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  const cleanUsername = username.trim().toLowerCase();
  
  if (cleanUsername.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (cleanUsername.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  // Reserved usernames
  const reserved = ['admin', 'root', 'user', 'test', 'guest', 'null', 'undefined'];
  if (reserved.includes(cleanUsername)) {
    return { isValid: false, error: 'This username is reserved' };
  }
  
  return { isValid: true, username: cleanUsername };
};

export const validatePhoneNumber = (phoneNumber) => {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  
  if (!isValidPhoneNumber(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  
  return { isValid: true, phoneNumber: cleanPhone };
};

// Personal Information Validation
export const validatePersonalInfo = (data) => {
  const errors = [];
  
  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  
  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }
  
  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push({ field: 'email', message: emailValidation.error });
    }
  }
  
  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      errors.push({ field: 'username', message: usernameValidation.error });
    }
  }
  
  if (data.phoneNumber) {
    const phoneValidation = validatePhoneNumber(data.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.push({ field: 'phoneNumber', message: phoneValidation.error });
    }
  }
  
  if (data.dateOfBirth) {
    const age = calculateAge(data.dateOfBirth);
    if (age < 13) {
      errors.push({ field: 'dateOfBirth', message: 'Must be at least 13 years old' });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility Functions
export const cleanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (digits.length === 10) {
    return `+1${digits}`; // US/Canada
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  } else if (digits.startsWith('+')) {
    return phoneNumber;
  }
  
  return `+${digits}`;
};

export const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  
  return phoneNumber;
};

// Error Handling
export const getGoogleAuthError = (error) => {
  switch (error.code) {
    case 'SIGN_IN_CANCELLED':
      return 'Sign-in was cancelled';
    case 'IN_PROGRESS':
      return 'Sign-in already in progress';
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      return 'Google Play Services not available';
    case 'SIGN_IN_REQUIRED':
      return 'Sign-in required';
    default:
      return error.message || 'Google sign-in failed';
  }
};

export const getPhoneAuthError = (error) => {
  switch (error.code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format';
    case 'auth/too-many-requests':
      return 'Too many requests. Please try again later';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Please try again later';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code';
    case 'auth/code-expired':
      return 'Verification code has expired';
    default:
      return error.message || 'Phone verification failed';
  }
};

export const getFirebaseAuthError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/user-disabled':
      return 'Account has been disabled';
    default:
      return error.message || 'Authentication failed';
  }
};

// Registration Data Preparation
export const prepareRegistrationData = (userData, authMethod) => {
  const baseData = {
    firstName: userData.firstName?.trim() || '',
    lastName: userData.lastName?.trim() || '',
    email: userData.email?.trim().toLowerCase() || '',
    username: userData.username?.trim().toLowerCase() || '',
    userType: userData.userType || 'PLAYER',
    sport: userData.sport?.trim() || '',
    authMethod,
    registeredAt: new Date().toISOString(),
    emailOptIn: userData.emailOptIn !== false,
    profileImage: userData.profileImage || null
  };

  // Add auth-method specific data
  switch (authMethod) {
    case 'google':
      return {
        ...baseData,
        googleId: userData.googleId || '',
        emailVerified: true
      };
    
    case 'phone':
      return {
        ...baseData,
        phoneNumber: userData.phoneNumber || '',
        phoneVerified: true
      };
    
    case 'email':
    default:
      return {
        ...baseData,
        securityQuestion: userData.securityQuestion?.trim() || '',
        securityAnswer: userData.securityAnswer ? 
          require('crypto-js').SHA256(userData.securityAnswer.toLowerCase().trim()).toString() : '',
        emailVerified: false
      };
  }
};

export default {
  // Google Auth
  initializeGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  getCurrentGoogleUser,
  
  // Phone Auth
  sendPhoneVerification,
  verifyPhoneCode,
  
  // Validation
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validatePersonalInfo,
  
  // Utilities
  cleanPhoneNumber,
  formatPhoneNumber,
  calculateAge,
  prepareRegistrationData,
  
  // Error handling
  getGoogleAuthError,
  getPhoneAuthError,
  getFirebaseAuthError
};