import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { emailSignup, googleLogin } from '../utils/authService';
import { useTheme } from '../utils/ThemeContext';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await emailSignup(email, password, name);

      Alert.alert(
        'Success',
        'Account created successfully! Please login.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      console.log('Signup error:', err.message);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError('');

      const { token, user } = await googleLogin();
      console.log('Google signup successful:', user);
      navigation.replace('DashboardTabs');
    } catch (err) {
      console.error('Google signup error:', err);
      const errorMessage = err.message || 'Google signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />
      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Signup</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={[styles.input, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text
          }]}
          placeholder="Full Name"
          placeholderTextColor={theme.placeholder}
          value={name}
          onChangeText={setName}
        />

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
          style={[styles.button, {
            backgroundColor: theme.primary,
            shadowColor: theme.shadowColor
          }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.buttonText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.orText, { color: theme.text }]}>OR</Text>

        <TouchableOpacity
          style={[styles.button, styles.googleButton, {
            shadowColor: theme.shadowColor
          }]}
          onPress={handleGoogleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: theme.primary }]}>
            Already have an account? Login
          </Text>
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
    resizeMode: 'cover'
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    width: 300,
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5
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
    backgroundColor: '#db4437'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10
  },
  link: {
    marginTop: 10
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default SignupScreen;
