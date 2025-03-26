import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const API_URL = 'https://67dd0778e00db03c4069dbf8.mockapi.io/users';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const navigation = useNavigation();

  const getPassword = async () => {
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
      setPassword('');

      const response = await axios.get(API_URL);
      const users = response.data;

      const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        setError('Email does not exist');
      } else {
        setPassword(user.password);
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />
      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
            setPassword('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, shadowColor: theme.shadowColor }]}
          onPress={getPassword}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={theme.buttonText} /> : <Text style={[styles.buttonText, { color: theme.buttonText }]}>Get Password</Text>}
        </TouchableOpacity>

        {password ? (
          <View style={[styles.passwordContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.passwordLabel, { color: theme.textSecondary }]}>Your password is:</Text>
            <Text style={[styles.passwordText, { color: theme.text }]}>{password}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
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
  passwordContainer: {
    width: 300,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    alignItems: 'center',
  },
  passwordLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  passwordText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 25,
  },
  link: {
    fontSize: 16,
  },
});
