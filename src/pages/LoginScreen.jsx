import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { emailLogin } from '../utils/authService';
import { configureGoogleSignIn } from '../utils/firebaseAuthService';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useTheme } from '../utils/ThemeContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const setupGoogleSignIn = async () => {
      try {
        const isConfigured = await configureGoogleSignIn();
        setGoogleConfigured(isConfigured);
        if (!isConfigured) {
          console.warn('Google Sign-In configuration failed');
        }
      } catch (err) {
        console.error('Error configuring Google Sign-In:', err);
      }
    };
    
    setupGoogleSignIn();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setEmailLoading(true);
      setError('');

      const { token, user } = await emailLogin(email, password);

      console.log('Login successful:', user);
      navigation.replace('DashboardTabs');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLoginSuccess = (result) => {
    navigation.replace('DashboardTabs');
  };

  const handleGoogleLoginFailure = (errorMessage) => {
    if (errorMessage.includes('cancelled')) {
      // User cancelled, don't show error
      return;
    }
    setError(errorMessage);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />
      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Login</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={[styles.input, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text
          }]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text
          }]}
          placeholder="Password"
          placeholderTextColor={theme.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: theme.primary,
            shadowColor: theme.shadowColor
          }]}
          onPress={handleLogin}
          disabled={emailLoading}
        >
          {emailLoading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.orText, { color: theme.text }]}>OR</Text>

        {googleConfigured && (
          <View style={styles.googleButtonContainer}>
            <GoogleSignInButton
              onLoginSuccess={handleGoogleLoginSuccess}
              onLoginFailure={handleGoogleLoginFailure}
              loading={googleLoading}
              setLoading={setGoogleLoading}
              customText="Sign in with Google"
            />
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.link, { color: theme.primary }]}>Create a new account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
    marginBottom: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  link: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    width: 300,
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    opacity: 0.8,
  },
  googleButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
});

export default LoginScreen;