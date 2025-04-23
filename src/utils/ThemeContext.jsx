import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('isDarkMode');
        if (storedTheme !== null) {
          setIsDarkMode(JSON.parse(storedTheme));
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error.message);
      }
    };

    loadThemePreference();
  }, []);

  const lightTheme = {
    background: '#f8f9fa',
    text: '#1d3557',
    textSecondary: '#6c757d',
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    buttonText: '#ffffff',
    cardBackground: '#ffffff',
    cardHeaderText: '#ffffff',
    inputBackground: '#ffffff',
    border: '#ced4da',
    placeholder: '#6c757d',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    divider: '#e9ecef',
    statusBarStyle: 'dark-content',
    // Task specific colors
    taskCardBg: '#ffffff',
    taskHeaderBg: '#343a40',
    taskBorderColor: '#dee2e6',
    // Calendar specific colors
    calendarBg: '#ffffff',
    selectedDayBg: '#007bff',
    dayWithTasksBg: '#ff4d4d',
    // Stats specific colors
    statCardBg: '#ffffff',
    statValueColor: '#008B8B',
  };

  const darkTheme = {
    background: '#121212',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    buttonText: '#ffffff',
    cardBackground: '#1e1e1e',
    cardHeaderText: '#ffffff',
    inputBackground: '#2d2d2d',
    border: '#333333',
    placeholder: '#cccccc',
    shadowColor: 'rgba(255, 255, 255, 0.05)',
    divider: '#2d2d2d',
    statusBarStyle: 'light-content',
    // Task specific colors
    taskCardBg: '#1e1e1e',
    taskHeaderBg: '#2d2d2d',
    taskBorderColor: '#333333',
    // Calendar specific colors
    calendarBg: '#1e1e1e',
    selectedDayBg: '#0d6efd',
    dayWithTasksBg: '#dc3545',
    // Stats specific colors
    statCardBg: '#1e1e1e',
    statValueColor: '#00CED1',
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
