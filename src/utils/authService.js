import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Profile } from 'react-native-fbsdk-next';
import { GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';


const API_URL = 'https://67dd0778e00db03c4069dbf8.mockapi.io/users';
const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';


const generateToken = (email) => {
  return Date.now() + '-' + email + '-' + Math.random().toString(36).substring(2, 15);
};

// Store auth data in AsyncStorage
const storeAuthData = async (token, userData) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
};

// Configure Google Sign-In with optimal parameters for Android
try {
  GoogleSignin.configure({
    webClientId: '63084503455-k3p98g2cb25932trloj5v04f1l57g6dh.apps.googleusercontent.com',
    offlineAccess: false,
    forceCodeForRefreshToken: false,
    
    scopes: ['email'],
    
    accountName: '', 
  });
} catch (error) {
  console.error('Failed to configure Google Sign-In:', error);
}

// Email Login
export const emailLogin = async (email, password) => {
  try {
    if (!email || !password) throw new Error('Email and password are required');

    const { data } = await axios.get(`${API_URL}?email=${email}`);
    if (data.length === 0) throw new Error('User not found');

    const user = data[0];
    if (user.password !== password) throw new Error('Incorrect password');

    const token = Date.now() + '-' + email;
    await storeAuthData(token, user);

    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Email Signup
export const emailSignup = async (email, password, name) => {
  try {
    const { data } = await axios.get(`${API_URL}?email=${email}`);
    if (data.length > 0) throw new Error('User already exists');

    const newUser = {
      id: 'U' + Math.floor(Math.random() * 10000),
      name,
      email,
      password,
      role: 'Developer'
    };

    await axios.post(API_URL, newUser);
    const token = Date.now() + '-' + email;
    await storeAuthData(token, newUser);

    return { token, user: newUser };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Get current user from storage
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

// Check if user is logged in
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return !!token && !!userJson;
  } catch (error) {
    return false;
  }
};

// Logout function 
export const logout = async () => {
  try {
    if (GoogleSignin) {
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) await GoogleSignin.signOut();
      } catch (error) { }
    }

    try {
      LoginManager.logOut();
    } catch (error) { }

    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};


const createMockGoogleUser = async () => {
  const userId = 'G' + Math.floor(Math.random() * 1000000);

  const userData = {
    id: userId,
    name: 'Google User',
    email: `googleuser${userId.substring(1)}@gmail.com`,
    photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
    role: 'Developer',
    provider: 'google'
  };

  const token = `google-mock-${Date.now()}-${userId}`;
  await storeAuthData(token, userData);

  return { token, user: userData };
};


export const googleLogin = async () => {
  try {
    
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
     
    }

   
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });


    const userInfo = await GoogleSignin.signIn();

    if (userInfo && userInfo.user) {
      const userData = {
        id: 'G' + Math.floor(Math.random() * 10000),
        name: userInfo.user.name || 'Google User',
        email: userInfo.user.email,
        photoURL: userInfo.user.photo,
        role: 'Developer',
        provider: 'google'
      };

      const token = userInfo.idToken || `google-${Date.now()}`;
      await storeAuthData(token, userData);

      return { token, user: userData };
    } else {
 
      console.log('No user info from Google, using fallback');
      return createMockGoogleUser();
    }
  } catch (error) {
    if (error.toString().includes('ApiException')) {
      console.log('Using Google mock login (ApiException occurred)');
      return createMockGoogleUser();
    }

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play Services not available, using mock auth');
      return createMockGoogleUser();
    }

    console.log('Using Google mock login due to error:', error.message || 'Unknown error');
    return createMockGoogleUser();
  }
};

export const facebookLogin = async () => {
  try {
    LoginManager.logOut();
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

    if (result.isCancelled) throw new Error('Facebook login was cancelled');

    const data = await AccessToken.getCurrentAccessToken();
    if (!data) throw new Error('Failed to get Facebook access token');

    const profile = await Profile.getCurrentProfile();
    if (!profile) throw new Error('Failed to get Facebook profile');

    const userData = {
      id: 'F' + profile.userID,
      name: profile.name,
      email: `${profile.userID}@facebook.com`,
      photoURL: profile.imageURL,
      role: 'Developer',
      provider: 'facebook'
    };

    await storeAuthData(data.accessToken.toString(), userData);
    return { token: data.accessToken.toString(), user: userData };
  } catch (error) {
    console.error('Facebook login error:', error);
    throw error;
  }
};
