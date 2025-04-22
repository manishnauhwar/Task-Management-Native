import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosinstance';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

// Clear corrupted data
const clearCorruptedData = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing corrupted data:', error);
  }
};

const storeAuthData = async (token, userData) => {
  try {
    // Store only essential user data
    const essentialUserData = {
      id: userData.id || userData._id,
      fullname: userData.fullname,
      email: userData.email,
      role: userData.role
    };

    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(essentialUserData));
  } catch (error) {
    console.error('Error storing auth data:', error);
    await clearCorruptedData();
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
    if (!token) {
      return null;
    }

    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (!userData) {
        return null;
      }

      // Parse the stored essential user data
      const parsedUserData = JSON.parse(userData);
      
      // Fetch complete user data from server if needed
      try {
        const response = await axiosInstance.get(`/users/${parsedUserData.id}`, {
          params: {
            fields: 'id,fullname,email,role'
          }
        });
        if (response.data && response.data.user) {
          return response.data.user;
        }
      } catch (error) {
        console.error('Error fetching complete user data:', error);
        // Return the essential data if server fetch fails
        return parsedUserData;
      }

      return parsedUserData;
    } catch (error) {
      console.error('Error parsing user data:', error);
      await clearCorruptedData();
      return null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    await clearCorruptedData();
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
    // Import and use the Firebase signOut function
    const { signOut: firebaseSignOut } = require('./firebaseAuthService');
    
    // First call the Firebase signOut to handle Google sign out properly
    try {
      await firebaseSignOut();
      // console.log('Firebase user signed out successfully');
    } catch (firebaseError) {
      console.error('Firebase sign out error:', firebaseError);
      // Continue with local logout even if Firebase logout fails
    }

    // Clear local storage
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to logout');
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

export const checkAuthStatus = async (navigation) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigation.replace('Login');
      return false;
    }

    if (!validateToken(token)) {
      await clearCorruptedData();
      navigation.replace('Login');
      return false;
    }

    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (!userData) {
        await clearCorruptedData();
        navigation.replace('Login');
        return false;
      }

      // Try to parse the user data
      try {
        JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        await clearCorruptedData();
        navigation.replace('Login');
        return false;
      }

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigation.replace('DashboardTabs');
      return true;
    } catch (error) {
      console.error('Error checking user data:', error);
      await clearCorruptedData();
      navigation.replace('Login');
      return false;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    await clearCorruptedData();
    navigation.replace('Login');
    return false;
  }
};
