import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithCredential,
  signOut as firebaseSignOut
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosinstance';

// Constants
const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';
const WEB_CLIENT_ID = '279406075787-mlvgmdqfoe75sbsv0eoj62o9umg67h3i.apps.googleusercontent.com';

/**
 * Store user authentication data in AsyncStorage
 * @param {string} token - Authentication token
 * @param {object} userData - User data object
 */
const storeAuthData = async (token, userData) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    throw new Error('Failed to store authentication data');
  }
};

/**
 * Configure Google Sign-In
 */
export const configureGoogleSignIn = async () => {
  try {
    console.log('Configuring Google Sign-In with WebClientID:', WEB_CLIENT_ID);
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Play Services are available');
      return true;
    } catch (playServicesError) {
      console.error('Google Play Services error:', playServicesError);
      return false;
    }
  } catch (error) {
    console.error('Google Sign-In configuration error:', error);
    return false;
  }
};

/**
 * Sign in with Google using Firebase Authentication
 */
export const googleSignIn = async () => {
  try {
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('Google Play Services check passed');
    
    console.log('Attempting to get Google Sign-In...');
    const response = await GoogleSignin.signIn();
    console.log('Google Sign-In response structure:', JSON.stringify(response, null, 2));
    
    const userInfo = response.data || response;
    
    const userEmail = userInfo.user?.email || userInfo.email;
    console.log('Google Sign-In successful, user email:', userEmail);
    
    const idToken = userInfo.idToken;
    
    if (!idToken) {
      console.error('Google Sign-In cancelled or failed:', JSON.stringify(response, null, 2));
      throw new Error('Google Sign-In cancelled or failed');
    }
    
    console.log('ID Token successfully retrieved');
    
    console.log('Creating Google credential');
    let googleCredential;
    try {
      googleCredential = GoogleAuthProvider.credential(idToken);
    } catch (credError) {
      console.error('Error creating Google credential:', credError);
      throw new Error('Failed to create authentication credential');
    }
    
    // Get auth instance
    const auth = getAuth();
    
    // Sign in with the credential
    console.log('Signing in with Firebase credential');
    let userCredential;
    try {
      userCredential = await signInWithCredential(auth, googleCredential);
    } catch (signInError) {
      console.error('Firebase sign-in error:', signInError);
      throw new Error(signInError.message || 'Firebase authentication failed');
    }
    
    // Get user info from Firebase
    const firebaseUser = userCredential.user;
    console.log('Firebase sign-in successful:', firebaseUser.email);
    
    // Prepare Firebase user data for our backend
    const firebaseData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || userInfo.user?.name || '',
      photoURL: firebaseUser.photoURL
    };
    
    console.log('Sending Firebase user data to backend:', JSON.stringify(firebaseData));
    
    // Send Firebase user data to our backend
    const backendResponse = await axiosInstance.post('/users/google-auth', firebaseData);
    
    if (!backendResponse.data || !backendResponse.data.token || !backendResponse.data.user) {
      throw new Error('Invalid response from server');
    }
    
    // Get user and token from our backend
    const { token, user } = backendResponse.data;
    
    console.log('Backend authentication successful:', JSON.stringify(user));
    
    // Store auth data locally
    await storeAuthData(token, user);
    
    // Set authorization header for future requests
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { token, user };
  } catch (error) {
    console.error('Google Sign-In error:', error.code, error.message);
    
    // Handle specific error cases
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address but different sign-in credentials');
    } else if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play services are not available or outdated');
    }
    
    throw new Error(error.message || 'Google authentication failed');
  }
};

/**
 * Sign out from Firebase Authentication and Google
 */
export const signOut = async () => {
  try {
    // Get auth instance
    const auth = getAuth();
    
    // Check if there's a current user before signing out from Firebase
    if (auth.currentUser) {
      // Sign out from Firebase
      await firebaseSignOut(auth);
    } else {
      console.log('No Firebase user to sign out');
    }
    
    // Sign out from Google (this should work even if not signed in)
    try {
      await GoogleSignin.signOut();
    } catch (googleError) {
      console.log('Google Sign out issue (non-critical):', googleError.message);
      // Continue with the logout process even if Google sign-out fails
    }
    
    // Clear local storage
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    // Don't throw here, just log the error and continue
    return true;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const userString = await AsyncStorage.getItem(USER_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}; 