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
import { emailSignup } from '../utils/authService';
// import { googleSignIn } from '../utils/googleAuthService';
import { useTheme } from '../utils/ThemeContext';
// import GoogleSignInButton from '../components/GoogleSignInButton';

const SignupScreen = ({ navigation }) => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors]     = useState({
    name: '', email: '', password: '', general: ''
  });
  const [focusedInputs, setFocusedInputs] = useState({
    name: false,
    email: false,
    password: false
  });
  const { theme } = useTheme();

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

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

  const handleInputFocus = (field) => {
    setFocusedInputs(prev => ({ ...prev, [field]: true }));
  };

  const handleInputBlur = (field, value) => {
    setFocusedInputs(prev => ({ ...prev, [field]: false }));
    if (field === 'name') {
      const norm = normalizeName(value);
      setName(norm);
      setErrors(prev => ({ ...prev, name: validateName(norm) }));
    } else if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

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

  const isFormValid = 
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password);

  const handleSignup = async () => {
    if (!validateAllInputs()) return;

    if (isMounted.current) {
      setErrors(prev => ({ ...prev, general: '' }));
      setEmailLoading(true);
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
      if (isMounted.current) setEmailLoading(false);
    }
  };

  // const handleGoogleLoginSuccess = (result) => {
  //   navigation.navigate('Home');
  // };

  // const handleGoogleLoginFailure = (errorMessage) => {
  //   setErrors(prev => ({ ...prev, general: errorMessage }));
  // };

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
                borderColor: errors.name && !focusedInputs.name ? 'red' : theme.border,
                color: theme.text
              }
            ]}
            value={name}
            onChangeText={setName}
            onFocus={() => handleInputFocus('name')}
            onBlur={() => handleInputBlur('name', name)}
          />
          {errors.name && !focusedInputs.name && <Text style={styles.fieldError}>{errors.name}</Text>}
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
                borderColor: errors.email && !focusedInputs.email ? 'red' : theme.border,
                color: theme.text
              }
            ]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => handleInputFocus('email')}
            onBlur={() => handleInputBlur('email', email)}
          />
          {errors.email && !focusedInputs.email && <Text style={styles.fieldError}>{errors.email}</Text>}
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
                borderColor: errors.password && !focusedInputs.password ? 'red' : theme.border,
                color: theme.text
              }
            ]}
            value={password}
            onChangeText={setPassword}
            onFocus={() => handleInputFocus('password')}
            onBlur={() => handleInputBlur('password', password)}
          />
          {errors.password && !focusedInputs.password && <Text style={styles.fieldError}>{errors.password}</Text>}
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.shadowColor,
              opacity: emailLoading || !isFormValid ? 0.6 : 1
            }
          ]}
          onPress={handleSignup}
          disabled={emailLoading || !isFormValid}
        >
          {emailLoading
            ? <ActivityIndicator color={theme.buttonText} />
            : <Text style={[styles.buttonText, { color: theme.buttonText }]}>Sign Up</Text>
          }
        </TouchableOpacity>

        {/* <Text style={[styles.orText, { color: theme.text }]}>OR</Text> */}

        {/* Google Signup */}
        {/* <GoogleSignInButton
          onLoginSuccess={handleGoogleLoginSuccess}
          onLoginFailure={handleGoogleLoginFailure}
          loading={googleLoading}
          setLoading={setGoogleLoading}
          customText="Sign up with Google"
        /> */}

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
  formContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 20, paddingHorizontal: 20 },
  title:         { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputContainer:{ width: 300, marginBottom: 15 },
  input:         { width: '100%', height: 40, borderWidth: 1, padding: 10, borderRadius: 5, fontSize: 16 },
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
