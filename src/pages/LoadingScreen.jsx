import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { checkAuthStatus } from '../utils/authService';
import { useTheme } from '../utils/ThemeContext';

const LoadingScreen = ({ navigation }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setTimeout(async () => {
          await checkAuthStatus(navigation);
        }, 1000);
      } catch (error) {
        console.error('Authentication check error:', error);
        navigation.replace('Login');
      }
    };

    checkAuth();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.text }]}>Loading...</Text>
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