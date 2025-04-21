// DEPRECATED: This file is deprecated. Please use firebaseAuthService.js instead.
// This file will be removed in a future update.

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosinstance';

// Constants
const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

const WEB_CLIENT_ID = '63084503455-6tg1mgrak7eom4vcg8f1l8ig9d2v8s58.apps.googleusercontent.com';

const storeAuthData = async (token, userData) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    throw new Error('Failed to store authentication data');
  }
};

/**
 * Configures GoogleSignin with necessary parameters
 */
export const configureGoogleSignIn = async () => {
  try {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true
    });
    
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Performs Google OAuth 2.0 authentication flow and communicates with backend
 */
export const googleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('GoogleSignin hasPlayServices');
    const userInfo = await GoogleSignin.signIn();
    console.log('GoogleSignin signIn', userInfo);
    if (!userInfo.idToken) {
      console.log('No ID token received');
      throw new Error('No ID token received');
    }
    
    const response = await axiosInstance.post('/google', {
      token: userInfo.idToken
    });
    
    if (!response.data.success) {
      throw new Error(response.data?.message || 'Backend authentication failed');
    }
    
    const { token, ...userData } = response.data.user;
    
    await storeAuthData(token, userData);
    
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { token, user: userData };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play services are not available');
    }
    
    throw error.message ? new Error(error.message) : new Error('Google authentication failed');
  }
};

/**
 * Signs out from Google and clears local authentication data
 */
export const googleSignOut = async () => {
  try {
    await GoogleSignin.signOut();
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    
    delete axiosInstance.defaults.headers.common['Authorization'];
    
    return true;
  } catch (error) {
    throw new Error('Failed to sign out');
  }
};