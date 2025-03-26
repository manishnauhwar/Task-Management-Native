import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NotificationProvider } from './src/utils/NotificationContext';
import { ThemeProvider, useTheme } from './src/utils/ThemeContext';

import LoginScreen from './src/pages/LoginScreen';
import SignupScreen from './src/pages/SignupScreen';
import ForgotPasswordScreen from './src/pages/ForgotPasswordScreen';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AccountStack = createNativeStackNavigator();

const TOKEN_KEY = '@auth_token';

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

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          height: 60,
          borderTopWidth: 0,
          borderTopColor: theme.border,
        },
        tabBarIcon: ({ size }) => {
          let iconName;
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

          return <Icon name={iconName ?? ''} size={size} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboardscreen} />
      <Tab.Screen name="Tasks" component={TaskScreen} />
      <Tab.Screen name="KanbanBoard" component={KanbanBoardScreen} />
      <Tab.Screen name="Admin" component={AdminScreen} />
      <Tab.Screen name="Manager" component={ManagerScreen} />
      <Tab.Screen name="Account" component={AccountStackNavigator} />
    </Tab.Navigator>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      setIsAuthenticated(Boolean(token));
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return null;

  return (
    <ThemeProvider>
      <NotificationProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={isAuthenticated ? "DashboardTabs" : "Login"}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="DashboardTabs" component={DashboardTabs} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;