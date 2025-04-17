import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { emailSignup, googleLogin } from '../utils/authService';
import { useTheme } from '../utils/ThemeContext';

const SignupScreen = ({ navigation }) => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({
    name: '', email: '', password: '', general: ''
  });
  const { theme } = useTheme();

  // Ref to avoid setting state after unmount
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // Normalize name: trim + collapse spaces
  const normalizeName = input =>
    input.trim().replace(/\s+/g, ' ');

  // --- Validators ---
  const validateName = value => {
    const v = normalizeName(value);
    if (!v)                   return 'Please enter your name';
    if (v.length < 3)         return 'Name must be at least 3 characters';
    if (!/^[A-Za-z\s]+$/.test(v))
                              return 'Name should contain only letters and spaces';
    if (v.substring(0,3).includes(' '))
                              return 'First three characters cannot be spaces';
    return '';
  };

  const validateEmail = value => {
    if (!value.trim())        return 'Please enter your email';
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[A-Za-z]{2,7}$/;
    return emailRegex.test(value.trim())
      ? ''
      : 'Please enter a valid email address';
  };

  const validatePassword = value => {
    if (!value)               return 'Please enter a password';
    if (value.length < 6)     return 'Password must be at least 6 characters';
    return '';
  };

  // Run all validators, set errors, and return overall validity
  const validateAllInputs = () => {
    const nameError     = validateName(name);
    const emailError    = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({
      name:     nameError,
      email:    emailError,
      password: passwordError,
      general:  ''
    });

    return !(nameError || emailError || passwordError);
  };

  // Determine if form is valid right now
  const isFormValid = 
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password);

  // --- Handlers ---
  const handleSignup = async () => {
    // Never call API unless client-side validation passes
    if (!validateAllInputs()) return;

    if (isMounted.current) {
      setErrors(prev => ({ ...prev, general: '' }));
      setLoading(true);
    }

    try {
      const normalized = normalizeName(name);
      await emailSignup(email.trim(), password, normalized);

      if (isMounted.current) {
        Alert.alert(
          'Success',
          'Account created successfully! Please login.',
          [{ text: 'OK', onPress: () => navigation.replace('Login') }]
        );
      }
    } catch (err) {
      if (!isMounted.current) return;
      // Merge backend error messages into your errors state
      const updated = { ...errors };
      const msg = err.response?.data?.message || err.message || 'Signup failed';

      if (msg.toLowerCase().includes('email')) {
        updated.email = msg;
      } else if (
        msg.toLowerCase().includes('fullname') ||
        msg.toLowerCase().includes('user')
      ) {
        updated.name = msg;
      } else if (msg.toLowerCase().includes('password')) {
        updated.password = msg;
      } else {
        updated.general = msg;
      }

      setErrors(updated);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isMounted.current) {
      setErrors(prev => ({ ...prev, general: '' }));
      setLoading(true);
    }

    try {
      const { user } = await googleLogin();
      navigation.replace('DashboardTabs');
    } catch (err) {
      if (!isMounted.current) return;
      const fallback = err.message?.includes('cancelled')
        ? 'Google sign-in was cancelled.'
        : err.message?.includes('network')
          ? 'Network error. Please check your connection.'
          : 'Google signup failed. Please try again later.';
      setErrors(prev => ({ ...prev, general: fallback }));
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // --- Render ---
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('../assets/img.jpg')} style={styles.image} />

      <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Signup</Text>

        {errors.general ? (
          <Text style={styles.errorText}>{errors.general}</Text>
        ) : null}

        {/* Full Name */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: errors.name ? 'red' : theme.border,
                color: theme.text
              }
            ]}
            value={name}
            onChangeText={setName}
            onBlur={() => {
              const norm = normalizeName(name);
              setName(norm);
              setErrors(prev => ({
                ...prev,
                name: validateName(norm)
              }));
            }}
          />
          {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: errors.email ? 'red' : theme.border,
                color: theme.text
              }
            ]}
            value={email}
            onChangeText={setEmail}
            onBlur={() =>
              setErrors(prev => ({
                ...prev,
                email: validateEmail(email)
              }))
            }
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.placeholder}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: errors.password ? 'red' : theme.border,
                color: theme.text
              }
            ]}
            value={password}
            onChangeText={setPassword}
            onBlur={() =>
              setErrors(prev => ({
                ...prev,
                password: validatePassword(password)
              }))
            }
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.shadowColor,
              opacity: loading || !isFormValid ? 0.6 : 1
            }
          ]}
          onPress={handleSignup}
          disabled={loading || !isFormValid}
        >
          {loading
            ? <ActivityIndicator color={theme.buttonText} />
            : <Text style={[styles.buttonText, { color: theme.buttonText }]}>Sign Up</Text>
          }
        </TouchableOpacity>

        <Text style={[styles.orText, { color: theme.text }]}>OR</Text>

        {/* Google Signup */}
        <TouchableOpacity
          style={[styles.button, styles.googleButton, { shadowColor: theme.shadowColor }]}
          onPress={handleGoogleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign up with Google</Text>
          }
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
  container:     { flex: 1 },
  image:         { width: '100%', height: '40%', resizeMode: 'cover' },
  formContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title:         { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputContainer:{ width: 300, marginBottom: 15 },
  input:         { width: '100%', height: 40, borderWidth: 1, padding: 10, borderRadius: 5 },
  fieldError:    { color: 'red', fontSize: 12, marginTop: 2, marginLeft: 5 },
  button:        {
    padding: 10,
    borderRadius: 5,
    width: 300,
    alignItems: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButton:  { backgroundColor: '#db4437' },
  buttonText:    { color: '#fff', fontSize: 16 },
  orText:        { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  link:          { marginTop: 10 },
  errorText:     { color: 'red', marginBottom: 10, textAlign: 'center' },
});

export default SignupScreen;
