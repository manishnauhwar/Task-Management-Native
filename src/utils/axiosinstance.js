import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = 'https://taskmanagement-backend-2.onrender.com';
const TOKEN_KEY = '@auth_token';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
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
