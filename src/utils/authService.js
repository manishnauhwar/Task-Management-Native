import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axiosInstance from './axiosinstance';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

const storeAuthData = async (token, userData) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw new Error('Failed to store authentication data');
  }
};

const validateToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const emailLogin = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const response = await axiosInstance.post('/users/login', {
      email,
      password,
    });

    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response from server');
    }

    const { token, user } = response.data;

    if (!validateToken(token)) {
      throw new Error('Invalid token received');
    }

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await storeAuthData(token, user);
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Login failed');
    }
    throw error;
  }
};

export const emailSignup = async (email, password, name) => {
  try {
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }

    const response = await axiosInstance.post('/users/signup', {
      email,
      password,
      fullname: name,
    });

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Signup failed');
    }
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userData = await AsyncStorage.getItem(USER_KEY);

    if (!token || !userData) {
      return null;
    }

    if (!validateToken(token)) {
      await logout();
      return null;
    }

    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    return validateToken(token);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to logout');
  }
};

export const googleLogin = async () => {
  try {
    await GoogleSignin.configure({
      webClientId: process.env.GOOGLE_CLIENT_ID,
      offlineAccess: true,
    });

    const { idToken } = await GoogleSignin.signIn();

    if (!idToken) {
      throw new Error('Failed to get ID token from Google');
    }

    const response = await axiosInstance.post('/google', {
      token: idToken,
    });

    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response from server');
    }

    const token = response.data.token;
    const user = response.data.user;

    if (!validateToken(token)) {
      throw new Error('Invalid token received');
    }

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await storeAuthData(token, user);
    return { token, user };
  } catch (error) {
    console.error('Google login error:', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in is in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services are not available');
    } else if (error.response) {
      throw new Error(error.response.data?.message || 'Google login failed');
    }
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const response = await axiosInstance.get(`/users/check-email/${email}`);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Password reset request failed');
    }
    throw error;
  }
};

export const verifyResetToken = async (token) => {
  try {
    if (!token) {
      throw new Error('Reset token is required');
    }

    const response = await axiosInstance.get(`/users/verify-reset-token/${token}`);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Invalid or expired reset token');
    }
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    const response = await axiosInstance.post(`/users/reset-password/${token}`, {
      newPassword,
    });

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Password reset failed');
    }
    throw error;
  }
};

export const checkAuthStatus = async (navigation) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userData = await AsyncStorage.getItem(USER_KEY);

    if (!token || !userData) {
      console.log('No auth token found, redirecting to login');
      navigation.replace('Login');
      return false;
    }

    if (!validateToken(token)) {
      console.log('Invalid token format, logging out');
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      navigation.replace('Login');
      return false;
    }

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('Token and user data found, proceeding to dashboard');
    navigation.replace('DashboardTabs');
    return true;

  } catch (error) {
    console.error('Error checking auth status:', error);
    navigation.replace('Login');
    return false;
  }
};
