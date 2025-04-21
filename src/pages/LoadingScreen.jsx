import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { checkAuthStatus, getCurrentUser } from '../utils/authService';
import { useTheme } from '../utils/ThemeContext';
import { onAuthStateChanged, getAuth } from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../utils/authService';

const LoadingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  async function handleAuthStateChanged(user) {
    if (initializing) setInitializing(false);
    
    if (user) {
      // User is signed in with Firebase, check if local auth data exists
      console.log('Firebase user is signed in:', user.email);
      
      // Check if we have local auth data
      const localUser = await getCurrentUser();
      
      if (!localUser) {
        console.log('Firebase user exists but no local auth data, logging out from Firebase');
        await logout(); // This will handle both Firebase and local logout
        navigation.replace('Login');
      } else {
        // Both Firebase and local auth are valid
        navigation.replace('DashboardTabs');
      }
    } else {
      // No Firebase user, check traditional auth
      checkAuthStatus(navigation);
    }
  }

  useEffect(() => {
    // Subscribe to auth state changes using modular API
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    
    // Unsubscribe on unmount
    return subscriber;
  }, [navigation]);

  if (initializing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.text, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.text }]}>Checking authentication...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default LoadingScreen; 