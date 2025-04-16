import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import axiosInstance from '../utils/axiosinstance';
import UserStats from '../components/profile/UserStats';
import AdminUserManagement from '../components/profile/AdminUserManagement';
import ProfileDetails from '../components/profile/ProfileDetails';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      const userData = await AsyncStorage.getItem('@user_data');
      if (!userData) {
        navigation.navigate('Login');
        return;
      }
      const { id } = JSON.parse(userData);
      const response = await axiosInstance.get(`/users/${id}`);

      if (response.data && response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        
        // Fetch profile picture if exists
        if (userData.profilePicture) {
          try {
            const profileResponse = await axiosInstance.get(`/users/${id}/profile-picture`);
            if (profileResponse.data && profileResponse.data.profilePictureUrl) {
              const imageUrl = `${profileResponse.data.profilePictureUrl}?t=${new Date().getTime()}`;
              userData.profilePictureUrl = imageUrl;
            }
          } catch (error) {
            console.error("Error fetching profile picture:", error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('@auth_token');
        await AsyncStorage.removeItem('@user_data');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'Error loading profile data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskData = async () => {
    if (user.role === 'user') {
      try {
        const response = await axiosInstance.get('/tasks', { params: { userId: user._id } });
        if (response.data && Array.isArray(response.data.tasks)) {
          setTasks(response.data.tasks);
        }
      } catch (error) {
        console.error("Error fetching tasks data:", error);
      }
    }
  };

  const fetchAllUsers = async () => {
    if (user.role === 'admin') {
      try {
        const response = await axiosInstance.get('/users/alluser', {
          params: { fields: 'id,fullname,email,role' }
        });
        if (response.data && Array.isArray(response.data.allUsers)) {
          const standardizedUsers = response.data.allUsers.map(u => ({
            ...u,
            id: u.id || u._id
          }));
          setAllUsers(standardizedUsers);
        }
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      fetchTaskData();
      fetchAllUsers();
    }
  }, [user]);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle} />
      <View style={styles.headerview}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Account')}>
          <Icon name="arrow-back-ios" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.text, { color: theme.text, marginTop: 10 }]}>Loading profile data...</Text>
          </View>
        ) : (
          <View style={[styles.section, {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.shadowColor,
          }]}>
            {/* Profile Details Component */}
            <ProfileDetails 
              user={user} 
              theme={theme} 
              onProfileUpdate={handleProfileUpdate}
            />
            
            {/* User Stats Component - Only for users */}
            {user.role === 'user' && (
              <UserStats tasks={tasks} theme={theme} />
            )}
            
            {/* Admin User Management Component - Only for admins */}
            {user.role === 'admin' && (
              <AdminUserManagement 
                allUsers={allUsers} 
                theme={theme} 
                onUsersUpdate={(updatedUsers) => setAllUsers(updatedUsers)} 
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  scrollContainer: {
    padding: 15,
  },
  section: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default ProfileScreen;