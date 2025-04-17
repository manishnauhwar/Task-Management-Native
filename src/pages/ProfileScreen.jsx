// ProfileScreen.js
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosinstance';
import { useTranslation } from 'react-i18next';

import UserStats from '../components/profile/UserStats';
import AdminUserManagement from '../components/profile/AdminUserManagement';
import ProfileDetails from '../components/profile/ProfileDetails';

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);

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

      const parsedUserData = JSON.parse(userData);

      if (parsedUserData.id) {
        try {
          const response = await axiosInstance.get(`/users/${parsedUserData.id}`);

          if (response.data && response.data.user) {
            const userData = response.data.user;

            if (!userData.id && userData._id) {
              userData.id = userData._id;
            }

            setUser(userData);

            if (userData.role === 'user') {
              await fetchTaskData(userData);
            }

            if (userData.role === 'admin') {
              await fetchAllUsers();
            }
          } else {
            setError(  t('profile.errorLoadUserData'));
          }
        } catch (error) {
          if (error.response) {
            setError( t('profile.errorLoadUserDetails'));
          }
        }
      } else {
        setError( t('profile.errorUserIdNotFound'));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('@auth_token');
        await AsyncStorage.removeItem('@user_data');
        navigation.navigate('Login');
      } else {
        setError( t('profile.errorLoadingProfile'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskData = async (userData) => {
    try {
      const response = await axiosInstance.get('/tasks');

      let allTasks = [];
      if (response.data && Array.isArray(response.data.tasks)) {
        allTasks = response.data.tasks;
      } else if (response.data && Array.isArray(response.data)) {
        allTasks = response.data;
      } else {
        return;
      }

      const userTasks = allTasks.filter(task => {
        const taskAssignedToId = task.assignedTo?._id || task.assignedTo;
        const taskUserId = task.userId?._id || task.userId;

        return taskUserId === userData.id || taskAssignedToId === userData.id;
      });

      setTasks(userTasks);
    } catch (error) {
      setError( t('profile.errorLoadTasks'));
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axiosInstance.get('/users/alluser', {
        params: { fields: 'id,fullname,email,role' }
      });

      if (response.data && Array.isArray(response.data.allUsers)) {
        const standardizedUsers = response.data.allUsers.map(u => ({
          id: u.id || u._id,
          fullname: u.fullname,
          email: u.email,
          role: u.role
        }));
        setAllUsers(standardizedUsers);
      }
    } catch (error) {
      setError( t('profile.errorLoadUserList'));
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);

    if (updatedUser.role === 'user') {
      fetchTaskData(updatedUser);
      setAllUsers([]);
    } else if (updatedUser.role === 'admin') {
      fetchAllUsers();
      setTasks([]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle} />
      <View style={styles.headerview}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Account')}>
          <Icon name="arrow-back-ios" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>{ t('profile.profile')}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.text, { color: theme.text, marginTop: 10 }]}>{ t('profile.loadingProfile')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchUserData}
          >
            <Text style={{ color: '#fff' }}>{  t('profile.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          </View>

          {/* Admin User Management Component - Only for admins */}
          {user.role === 'admin' && (
            <View style={[styles.section, {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.shadowColor,
            }]}>
              <AdminUserManagement
                allUsers={allUsers}
                theme={theme}
                onUsersUpdate={(updatedUsers) => setAllUsers(updatedUsers)}
              />
            </View>
          )}
        </ScrollView>
      )}
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
