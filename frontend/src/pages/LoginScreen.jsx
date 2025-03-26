import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { googleLogin, facebookLogin, emailLogin } from '../utils/authService';
import { useTheme } from '../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginManager,
  AccessToken,
  Profile,
  GraphRequest,
  GraphRequestManager
} from 'react-native-fbsdk-next';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { token, user } = await emailLogin(email, password);
      console.log('Login successful', { token, user });
      navigation.replace('DashboardTabs');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { token, user } = await googleLogin();
      console.log('Google login successful', { token, user });
      navigation.replace('DashboardTabs');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
 
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_data');

      const { token, user } = await facebookLogin();
      console.log('Facebook login successful', { token, user });
      navigation.replace('DashboardTabs');
    } catch (error) {
      console.error('Facebook login error:', error);
      alert(error.message || 'Facebook login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />
      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Login</Text>
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
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.orText, { color: theme.text }]}>OR</Text>

        <TouchableOpacity
          style={[styles.button, styles.googleButton, {
            shadowColor: theme.shadowColor
          }]}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.buttonText}>Login with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.facebookButton, {
            shadowColor: theme.shadowColor
          }]}
          onPress={handleFacebookLogin}
        >
          <Text style={styles.buttonText}>Login with Facebook</Text>
        </TouchableOpacity>

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
  googleButton: {
    backgroundColor: '#db4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
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
  forgottextbox: {
    display: 'flex'
  },
  forgottext: {
    marginBottom: 10,
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
});

export default LoginScreen;

