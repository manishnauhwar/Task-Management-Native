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

  async function handleAuthStateChanged(user) {
    if (initializing) setInitializing(false);
    
    if (user) {
      
      const localUser = await getCurrentUser();
      
      if (!localUser) {
        await logout();
        navigation.replace('Login');
      } else {
        navigation.replace('DashboardTabs');
      }
    } else {
      checkAuthStatus(navigation);
    }
  }

  useEffect(() => {
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, handleAuthStateChanged);
    
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