import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosinstance';
import { useTranslation } from 'react-i18next';
import { useNavigationBar } from '../../App';

import UserStats from '../components/profile/UserStats';
import AdminUserManagement from '../components/profile/AdminUserManagement';
import ProfileDetails from '../components/profile/ProfileDetails';
import ManagerTeamManagement from '../components/profile/ManagerTeamManagement';


const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isGestureNavigationEnabled, bottomInset } = useNavigationBar();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);

  const getApiBaseUrl = () => {
    return axiosInstance.defaults.baseURL;
  };

  const getProfilePictureUrl = (userData) => {
    if (!userData) return null;

    // First check for Google profile picture
    if (userData.googleProfilePictureUrl) {
      return userData.googleProfilePictureUrl;
    }

    // Then check for profile picture URL
    if (userData.profilePictureUrl) {
      if (userData.profilePictureUrl.startsWith('data:') || userData.profilePictureUrl.startsWith('http')) {
        return userData.profilePictureUrl;
      }
      return getApiBaseUrl() + (userData.profilePictureUrl.startsWith('/') ? '' : '/') + userData.profilePictureUrl;
    }

    //check for binary profile picture data
    if (userData.profilePicture && userData.profilePicture.data) {
      return `${getApiBaseUrl()}/users/${userData.id}/profile-picture`;
    }

    return null;
  };

  const processUserData = (userData) => {
    if (!userData) return null;

    const userId = userData.id || userData._id;
    if (!userId) return null;

    return {
      ...userData,
      id: userId,
      googleProfilePictureUrl: userData.googleProfilePictureUrl,
      profilePictureUrl: userData.profilePictureUrl,
      profilePicture: userData.profilePicture
    };
  };

  const updateProfilePicture = (userData) => {
    if (!userData) {
      return;
    }
    
    
    const pictureUrl = getProfilePictureUrl(userData);
    setProfilePicture(pictureUrl);
  };

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      const processedUserData = processUserData(parsedUserData);
      
      if (!processedUserData) {
        setError(t('profile.errorUserIdNotFound'));
        setLoading(false);
        return;
      }

      setUser(processedUserData);
      updateProfilePicture(processedUserData);
      
      try {
        const response = await axiosInstance.get(`/users/${processedUserData.id}`, {
          params: {
            fields: 'id,fullname,email,role,googleProfilePictureUrl,profilePictureUrl,profilePicture'
          }
        });

        if (response.data && response.data.user) {
          const fetchedUserData = response.data.user;
          const processedFetchedData = processUserData(fetchedUserData);

          const updatedUserData = {
            ...processedFetchedData,
            googleProfilePictureUrl: processedFetchedData.googleProfilePictureUrl || processedUserData.googleProfilePictureUrl,
            profilePictureUrl: processedFetchedData.profilePictureUrl || processedUserData.profilePictureUrl,
            profilePicture: processedFetchedData.profilePicture || processedUserData.profilePicture,
            fullname: processedFetchedData.fullname || processedUserData.fullname,
            email: processedFetchedData.email || processedUserData.email,
            role: processedFetchedData.role || processedUserData.role
          };

          const essentialUserData = {
            id: updatedUserData.id,
            fullname: updatedUserData.fullname,
            email: updatedUserData.email,
            role: updatedUserData.role,
            googleProfilePictureUrl: updatedUserData.googleProfilePictureUrl,
            profilePictureUrl: updatedUserData.profilePictureUrl
          };
          await AsyncStorage.setItem('@user_data', JSON.stringify(essentialUserData));

          setUser(updatedUserData);
          updateProfilePicture(updatedUserData);

          if (updatedUserData.role === 'user') {
            await fetchTaskData(updatedUserData);
          } else if (updatedUserData.role === 'admin') {
            await fetchAllUsers();
          } else if (updatedUserData.role === 'manager') {
            await fetchTaskData(updatedUserData);
            await fetchTeams(updatedUserData);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        
        if (processedUserData.role === 'user') {
          await fetchTaskData(processedUserData);
        } else if (processedUserData.role === 'admin') {
          await fetchAllUsers();
        } else if (processedUserData.role === 'manager') {
          await fetchTaskData(processedUserData);
          await fetchTeams(processedUserData);
        }
      }
    } catch (error) {
      console.error('ProfileScreen error:', error);
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('@auth_token');
        await AsyncStorage.removeItem('@user_data');
        navigation.navigate('Login');
      } else {
        setError(t('profile.errorLoadingProfile'));
      }
    } finally {
      setLoading(false);
    }
  }, [navigation, t]);

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
        const userId = userData.id || userData._id;

        return taskUserId === userId || taskAssignedToId === userId;
      });

      setTasks(userTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(t('profile.errorLoadTasks'));
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log('Fetching all users...');
      
      try {
        const response = await axiosInstance.get('/users/alluser', {
          params: { fields: 'id,fullname,email,role' }
        });

        if (response.data && Array.isArray(response.data.allUsers)) {
          console.log(`Received ${response.data.allUsers.length} users`);
          
          const standardizedUsers = response.data.allUsers.map(u => ({
            id: u.id || u._id,
            fullname: u.fullname,
            email: u.email,
            role: u.role
          }));
          
          console.log('Setting users in state...');
          setAllUsers(standardizedUsers);
          return;
        }
      } catch (paramError) {
        console.log('Could not fetch with params, trying basic request');
      }

      const response = await axiosInstance.get('/users/alluser');

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
      console.error('Error fetching users:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
      }
      setError(t('profile.errorLoadUserList'));
    }
  };

  const fetchTeams = async (userData) => {
    try {
      const response = await axiosInstance.get('/teams');
      if (response.data && Array.isArray(response.data)) {
        const managedTeams = response.data.filter(
          team => team.manager && (team.manager._id === userData.id || team.manager === userData.id)
        );
        setTeams(managedTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError(t('profile.errorLoadTeams'));
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      return () => {
      };
    }, [fetchUserData])
  );

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    updateProfilePicture(updatedUser);

    if (updatedUser.role === 'user') {
      fetchTaskData(updatedUser);
      setAllUsers([]);
      setTeams([]);
    } else if (updatedUser.role === 'admin') {
      fetchAllUsers();
      setTasks([]);
      setTeams([]);
    } else if (updatedUser.role === 'manager') {
      fetchTaskData(updatedUser);
      setAllUsers([]);
    }
  };

  const handleTeamsUpdate = (updatedTeams) => {
    setTeams(updatedTeams);
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('User is admin, fetching all users...');
      fetchAllUsers();
    }
  }, [user?.role]);

  const getExtraBottomPadding = () => {
    const tabBarHeight = 60;
    
    const totalBottomPadding = tabBarHeight + (isGestureNavigationEnabled ? bottomInset : 0);
    
    return totalBottomPadding;
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
            <Text style={{ color: '#fff' }}>{ t('profile.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // For user and admin roles, use ScrollView
        user && user.role !== 'manager' ? (
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContentContainer,
              { paddingBottom: getExtraBottomPadding() }
            ]}
          >
            <View style={styles.container}>
              {user && user.fullname ? (
                <View style={[styles.section, {
                  backgroundColor: theme.cardBackground,
                  shadowColor: theme.shadowColor,
                }]}>
                  <ProfileDetails
                    user={user}
                    theme={theme}
                    onProfileUpdate={handleProfileUpdate}
                    profilePicture={profilePicture}
                    setProfilePicture={setProfilePicture}
                  />

                  {/* User Stats Component - Show only for users */}
                  {user.role === 'user' && (
                    <UserStats tasks={tasks} theme={theme} />
                  )}
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Icon name="error-outline" size={48} color={theme.error} />
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {t('profile.noUserDataAvailable')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.primary }]}
                    onPress={fetchUserData}
                  >
                    <Text style={{ color: '#fff' }}>{t('profile.retry')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Admin User Management Component - Only for admins */}
              {user && user.role === 'admin' && (
                <View style={[styles.section, {
                  backgroundColor: theme.cardBackground,
                  shadowColor: theme.shadowColor,
                  marginTop: 15,
                  marginBottom: 20,
                }]}>
                  <AdminUserManagement
                    allUsers={allUsers}
                    theme={theme}
                    onUsersUpdate={(updatedUsers) => {
                      console.log(`Updating users list with ${updatedUsers.length} users`);
                      setAllUsers(updatedUsers);
                    }}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          // For manager role, use View since ManagerTeamManagement already has FlatLists
          <View style={[styles.container, { paddingBottom: getExtraBottomPadding() }]}>
            {user && user.fullname ? (
              <View style={[styles.section, {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.shadowColor,
              }]}>
                <ProfileDetails
                  user={user}
                  theme={theme}
                  onProfileUpdate={handleProfileUpdate}
                  profilePicture={profilePicture}
                  setProfilePicture={setProfilePicture}
                />
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={48} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {t('profile.noUserDataAvailable')}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                  onPress={fetchUserData}
                >
                  <Text style={{ color: '#fff' }}>{t('profile.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Manager Team Management Component - Only for managers */}
            {user && user.role === 'manager' && (
              <View style={[styles.managerSection, {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.shadowColor,
              }]}>
                <ManagerTeamManagement
                  teams={teams}
                  user={user}
                  theme={theme}
                  onTeamsUpdate={handleTeamsUpdate}
                />
              </View>
            )}
          </View>
        )
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
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
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
  managerSection: {
    flex: 1,
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
