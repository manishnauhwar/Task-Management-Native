import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    console.log('💫 ProfileScreen: Fetching user data...');
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('@auth_token');
      console.log('💫 ProfileScreen: Auth token exists?', !!token);
      if (!token) {
        console.log('💫 ProfileScreen: No auth token found, redirecting to login');
        navigation.navigate('Login');
        return;
      }
      const userData = await AsyncStorage.getItem('@user_data');
      console.log('💫 ProfileScreen: User data exists in storage?', !!userData);
      if (!userData) {
        console.log('💫 ProfileScreen: No user data found, redirecting to login');
        navigation.navigate('Login');
        return;
      }

      // Parse user data and get user ID
      const parsedUserData = JSON.parse(userData);
      console.log('💫 ProfileScreen: User ID from storage:', parsedUserData.id);
      
      // If user ID exists, fetch user details from API (without profile picture)
      if (parsedUserData.id) {
        try {
          console.log(`💫 ProfileScreen: Fetching user details for ID: ${parsedUserData.id}`);
          const response = await axiosInstance.get(`/users/${parsedUserData.id}`);
          console.log('💫 ProfileScreen: User API response:', response.data);

          if (response.data && response.data.user) {
            const userData = response.data.user;
            console.log('💫 ProfileScreen: User role:', userData.role);
            
            // Set actual user ID if the API returns '_id' instead of 'id'
            if (!userData.id && userData._id) {
              userData.id = userData._id;
            }
            
            setUser(userData);
            
            // Only fetch tasks for regular users
            if (userData.role === 'user') {
              await fetchTaskData(userData);
            }
            
            // Only fetch all users for admin
            if (userData.role === 'admin') {
              await fetchAllUsers();
            }
          } else {
            console.error('💫 ProfileScreen: Invalid user data format from API');
            setError('Failed to load user data');
          }
        } catch (error) {
          console.error('💫 ProfileScreen: Error fetching user details:', error);
          if (error.response) {
            console.error('💫 ProfileScreen: Error response:', error.response.data);
          }
          setError('Failed to load user details');
        }
      } else {
        console.error('💫 ProfileScreen: User ID not found in storage data');
        setError('User ID not found');
      }
    } catch (error) {
      console.error('💫 ProfileScreen: Error in fetchUserData:', error);
      if (error.response?.status === 401) {
        console.log('💫 ProfileScreen: 401 Unauthorized, clearing tokens');
        await AsyncStorage.removeItem('@auth_token');
        await AsyncStorage.removeItem('@user_data');
        navigation.navigate('Login');
      } else {
        setError('Error loading profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskData = async (userData) => {
    // Only fetch tasks for regular users
    console.log('💫 ProfileScreen: Fetching tasks for user:', userData.id);
    try {
      // Fetch all tasks from API
      console.log('💫 ProfileScreen: Making API request to /tasks');
      const response = await axiosInstance.get('/tasks');
      console.log('💫 ProfileScreen: Tasks API response received');
      
      // Extract tasks array and handle different API response formats
      let allTasks = [];
      if (response.data && Array.isArray(response.data.tasks)) {
        allTasks = response.data.tasks;
      } else if (response.data && Array.isArray(response.data)) {
        allTasks = response.data;
      } else {
        console.warn('💫 ProfileScreen: Unexpected tasks data format:', response.data);
        return;
      }
      
      // Filter tasks for this specific user only
      const userTasks = allTasks.filter(task => {
        const taskAssignedToId = task.assignedTo?._id || task.assignedTo;
        const taskUserId = task.userId?._id || task.userId;
        
        return taskUserId === userData.id || taskAssignedToId === userData.id;
      });
      
      console.log(`💫 ProfileScreen: Filtered ${userTasks.length} tasks for this user`);
      setTasks(userTasks);
    } catch (error) {
      console.error("💫 ProfileScreen: Error fetching tasks data:", error);
      setError('Failed to load tasks');
    }
  };

  const fetchAllUsers = async () => {
    console.log('💫 ProfileScreen: Fetching all users (admin only)');
    try {
      // Only fetch minimal user data (id, fullname, email, role)
      const response = await axiosInstance.get('/users/alluser', {
        params: { fields: 'id,fullname,email,role' }
      });
      
      if (response.data && Array.isArray(response.data.allUsers)) {
        // Standardize user data format
        const standardizedUsers = response.data.allUsers.map(u => ({
          id: u.id || u._id, // Ensure consistent ID field
          fullname: u.fullname,
          email: u.email,
          role: u.role
        }));
        setAllUsers(standardizedUsers);
      } else {
        console.warn('💫 ProfileScreen: Unexpected format for all users:', response.data);
      }
    } catch (error) {
      console.error("💫 ProfileScreen: Error fetching all users:", error);
      setError('Failed to load user list');
    }
  };

  // Initial data fetch on component mount
  useEffect(() => {
    console.log('💫 ProfileScreen: Component mounted, fetching data');
    fetchUserData();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    console.log('💫 ProfileScreen: Profile updated', updatedUser);
    setUser(updatedUser);
    
    // If role changed, fetch appropriate data
    if (updatedUser.role === 'user') {
      fetchTaskData(updatedUser);
      setAllUsers([]); // Clear admin data
    } else if (updatedUser.role === 'admin') {
      fetchAllUsers();
      setTasks([]); // Clear user data
    }
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
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={fetchUserData}
            >
              <Text style={{ color: '#fff' }}>Retry</Text>
            </TouchableOpacity>
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

            {/* User Stats Component - Show only for users */}
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
    flexGrow: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default ProfileScreen;