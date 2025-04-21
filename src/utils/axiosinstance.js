import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const baseURL = 'http://10.0.2.2:5000';
const baseURL ='https://taskmanagement-backend-2.onrender.com';

const TOKEN_KEY = '@auth_token';

console.log('Initializing axios with baseURL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    
    if (config.data) {
      if (config.data instanceof FormData) {
        console.log('Request payload: [FormData]');
      } else {
        console.log('Request payload:', JSON.stringify(config.data, null, 2));
      }
    }
    
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added auth token to request');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`Response received from: ${response.config.url}, status: ${response.status}`);
    return response;
  },
  async (error) => {
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
    
    console.error('Response error:', JSON.stringify(errorInfo, null, 2));

    if (error.response?.status === 500 && error.response?.data?.stack) {
      console.error('Server stack trace:', error.response.data.stack);
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem('@user_data');
        console.log('Authentication failed, clearing tokens');
      } catch (e) {
        console.error('Error handling unauthorized access:', e);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
