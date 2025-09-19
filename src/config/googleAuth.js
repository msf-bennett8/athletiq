// src/config/googleAuth.js
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

/*
=== MY GOOGLE OAUTH CREDENTIALS ===
My ClientID: 497434151930-3vme1r2sicp5vhve5450nke3evaiq2nf

Platform-specific Client IDs (commented out - using web-only approach):
- expoClientId: 'YOUR_EXPO_CLIENT_ID' // Optional: Get this from Expo dashboard
- iosClientId: '497434151930-f5r2lef6pvlh5ptjlo08if5cb1adceop.apps.googleusercontent.com'
- androidClientId: '497434151930-3vme1r2sicp5vhve5450nke3evaiq2nf.apps.googleusercontent.com'
- webClientId: '497434151930-oq6o04sgmms52002jj4junb902ov29eo.apps.googleusercontent.com' // Currently active

=== ANDROID SHA1 FINGERPRINTS ===
Production: C1:EE:74:B4:2A:5B:E9:CB:78:5E:48:EA:D5:EA:C9:E5:59:9B:BE:46
Preview: 37:84:4B:58:85:E3:AB:A4:D7:26:99:55:ED:D6:3B:D6:42:69:ED:4F
Development: FB:ED:D0:F7:42:38:0F:80:71:CD:1D:AE:98:BA:5F:2F:A4:CB:B3:52
Production Logcat: C1:EE:74:B4:2A:5B:E9:CB:78:5E:48:EA:D5:EA:C9:E5:59:9B:BE:46
*/

export const useGoogleAuth = () => {
  if (__DEV__) {
    console.log('🔍 Google Auth Config - Platform:', Platform.OS);
    console.log('🔍 Development mode: Using web auth flow for all platforms');
  }
  
  const config = {
    // Currently using web-only approach for all platforms
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '497434151930-oq6o04sgmms52002jj4junb902ov29eo.apps.googleusercontent.com',
    
    // Platform-specific IDs (commented out - keeping web-only approach)
    // iosClientId: '497434151930-f5r2lef6pvlh5ptjlo08if5cb1adceop.apps.googleusercontent.com',
    // androidClientId: '497434151930-3vme1r2sicp5vhve5450nke3evaiq2nf.apps.googleusercontent.com',
    
    scopes: ['openid', 'profile', 'email'],
    additionalParameters: {
      prompt: 'select_account',
    },
  };
  
  if (__DEV__) {
    console.log('🔍 Google Auth Config:', { ...config, webClientId: 'REDACTED' });
  }
  
  return Google.useAuthRequest(config);
};