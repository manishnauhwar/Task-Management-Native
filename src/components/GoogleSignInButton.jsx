import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { googleSignIn } from '../utils/firebaseAuthService';

// Google logo SVG component
const GoogleLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);

const GoogleSignInButton = ({ onLoginSuccess, onLoginFailure, loading, setLoading, customStyle, customText }) => {
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await googleSignIn();
      onLoginSuccess(result);
    } catch (error) {
      onLoginFailure(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.buttonContainer, customStyle]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#4285F4" size="large" />
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={styles.googleIconContainer}>
            <GoogleLogo />
          </View>
          <Text style={styles.buttonText}>{customText || 'Sign in with Google'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: 300,
    height: 48,
    marginVertical: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dddddd',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    paddingHorizontal: 12,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  buttonText: {
    flex: 1,
    color: '#757575',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginRight: 24,
  },
  loadingContainer: {
    width: 300,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dddddd',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  }
});

export default GoogleSignInButton; 