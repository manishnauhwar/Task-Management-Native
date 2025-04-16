import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { verifyResetToken, resetPassword } from '../utils/authService';

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params || {};

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('Invalid reset token');
        setVerifying(false);
        return;
      }

      try {
        const response = await verifyResetToken(token);
        if (response.success) {
          setTokenValid(true);
        } else {
          setError('Invalid or expired reset token');
        }
      } catch (err) {
        setError(err.message || 'Invalid or expired reset token');
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await resetPassword(token, newPassword);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. Please login with your new password.',
          [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Verifying reset token...</Text>
        </View>
      </View>
    );
  }

  if (!tokenValid && !verifying) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.danger }]}>Reset Link Expired</Text>
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error || 'Your password reset link is invalid or has expired.'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Request New Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: theme.primary }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />
      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your new password below
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="New Password"
          placeholderTextColor={theme.placeholder}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Confirm Password"
          placeholderTextColor={theme.placeholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error ? <Text style={[styles.errorMessage, { color: theme.danger }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, shadowColor: theme.shadowColor }]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: theme.primary }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '40%',
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    paddingHorizontal: 20,
  },
  input: {
    width: 300,
    height: 40,
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    width: 300,
    alignItems: 'center',
    marginVertical: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    marginTop: 5,
    fontSize: 14,
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginBottom: 10,
  },
  backLink: {
    marginTop: 25,
  },
  link: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
}); 