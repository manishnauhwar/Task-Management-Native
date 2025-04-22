import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationProvider } from './src/utils/NotificationContext';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { getApps } from '@react-native-firebase/app';

import LoginScreen from './src/pages/LoginScreen';
import SignupScreen from './src/pages/SignupScreen';
import ForgotPasswordScreen from './src/pages/ForgotPasswordScreen';
import ResetPasswordScreen from './src/pages/ResetPasswordScreen';
import Dashboardscreen from './src/pages/Dashboardscreen';
import TaskScreen from './src/pages/TaskScreen';
import KanbanBoardScreen from './src/pages/KanbanBoardScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import NotificationScreen from './src/pages/NotificationScreen';
import SettingsScreen from './src/pages/SettingsScreen';
import AccountScreen from './src/pages/AccountScreen';
import AdminScreen from './src/pages/AdminScreen';
import ManagerScreen from './src/pages/ManagerScreen';
import CalendarScreen from './src/pages/CalendarScreen';
import LoadingScreen from './src/pages/LoadingScreen';
import UserScreen from './src/pages/UserScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AccountStack = createNativeStackNavigator();

const AccountStackNavigator = () => (
  <AccountStack.Navigator screenOptions={{ headerShown: false }}>
    <AccountStack.Screen name="AccountHome" component={AccountScreen} />
    <AccountStack.Screen name="Profile" component={ProfileScreen} />
    <AccountStack.Screen name="Notifications" component={NotificationScreen} />
    <AccountStack.Screen name="Settings" component={SettingsScreen} />
  </AccountStack.Navigator>
);

const DashboardTabs = () => {
  const { theme } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialRouteName, setInitialRouteName] = useState<string>('Dashboard');

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('@user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const getActiveTab = async () => {
      try {
        const activeTab = await AsyncStorage.getItem('@active_tab');
        if (activeTab) {
          setInitialRouteName(activeTab);
        }
      } catch (error) {
        console.error("Error fetching active tab:", error);
      }
    };

    getUserData();
    getActiveTab();
  }, []);

  // Function to save the current tab
  const saveCurrentTab = async (tabName: string) => {
    try {
      await AsyncStorage.setItem('@active_tab', tabName);
    } catch (error) {
      console.error("Error saving active tab:", error);
    }
  };

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        unmountOnBlur: true,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          height: 60,
          borderTopWidth: 0,
          borderTopColor: theme.border,
        },
        tabBarIcon: ({ size }) => {
          let iconName = '';
          let iconColor = theme.text;

          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
            iconColor = '#007bff';
          } else if (route.name === 'Tasks') {
            iconName = 'check-circle-outline';
            iconColor = '#28a745';
          } else if (route.name === 'KanbanBoard') {
            iconName = 'trello';
            iconColor = '#ff9800';
          } else if (route.name === 'user') {
            iconName = 'account-group';
            iconColor = '#e91e63';
          } else if (route.name === 'Admin') {
            iconName = 'shield-account';
            iconColor = '#1991d3';
          } else if (route.name === 'Manager') {
            iconName = 'account-tie';
            iconColor = '#1991d3';
          } else if (route.name === 'Account') {
            iconName = 'account';
            iconColor = '#e91e63';
          }

          return <Icon name={iconName} size={size} color={iconColor} />;
        },
      })}
      screenListeners={{
        state: (e) => {
          const currentRouteName = e.data.state.routes[e.data.state.index].name;
          saveCurrentTab(currentRouteName);
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboardscreen} />
      <Tab.Screen name="Tasks" component={TaskScreen} />
      <Tab.Screen name="KanbanBoard" component={KanbanBoardScreen} />
      <Tab.Screen name="user" component={UserScreen} />
      
      {userRole === 'admin' && (
        <Tab.Screen name="Admin" component={AdminScreen} />
      )}

      {userRole === 'manager' && (
        <Tab.Screen name="Manager" component={ManagerScreen} />
      )}

      <Tab.Screen name="Account" component={AccountStackNavigator} />
    </Tab.Navigator>
  );
};

const App = () => {
  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#007bff',
      secondary: '#6c757d',
    },
  };

  // Initialize Firebase
  useEffect(() => {
    // Check if Firebase is already initialized using modular API
    if (getApps().length) {
      // console.log('Firebase initialized');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <NotificationProvider>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="Loading">
                <Stack.Screen name="Loading" component={LoadingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen
                  name="ForgotPassword"
                  component={ForgotPasswordScreen}
                />
                <Stack.Screen
                  name="ResetPassword"
                  component={ResetPasswordScreen}
                />
                <Stack.Screen name="DashboardTabs" component={DashboardTabs} />
                <Stack.Screen name="Calendar" component={CalendarScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </NotificationProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App;