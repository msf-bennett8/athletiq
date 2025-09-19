import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const config = {
    webClientId: '497434151930-oq6o04sgmms52002jj4junb902ov29eo.apps.googleusercontent.com',
    iosClientId: '497434151930-f5r2lef6pvlh5ptjlo08if5cb1adceop.apps.googleusercontent.com',
    androidClientId: '497434151930-3vme1r2sicp5vhve5450nke3evaiq2nf.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  };

  const [request, response, promptAsync] = Google.useAuthRequest(config);
  
  const wrappedPromptAsync = async () => {
    try {
      return await promptAsync({
        showInRecents: false,
      });
    } catch (error) {
      console.error('Google Auth Error:', error);
      return { type: 'error', error };
    }
  };

  return [request, response, wrappedPromptAsync];
};