import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { forgotPassword } from '../utils/authService';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { theme } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email format');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await forgotPassword(email);

      if (response.exists) {
        setSuccess(true);
        setCountdown(30);
        Alert.alert(
          'Success',
          'Password reset link has been sent to your email. Please check your inbox.',
          [{ text: 'OK' }]
        );
      } else {
        setError('Email not found in our records');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />
      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
        {success && (
          <Text style={[styles.successText, { color: theme.success }]}>
            Reset link sent! Check your email.
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: countdown > 0 ? theme.disabled : theme.primary,
              shadowColor: theme.shadowColor
            }
          ]}
          onPress={handleResetPassword}
          disabled={loading || countdown > 0}
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Send Reset Link'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.link, { color: theme.primary }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;
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
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  button: {
    padding: 10,
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
  errorText: {
    marginTop: 5,
    fontSize: 14,
    alignSelf: 'flex-start',
    marginLeft: 5,
  },
  successText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  backLink: {
    marginTop: 25,
  },
  link: {
    fontSize: 16,
  },
});

