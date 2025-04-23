import React, { useState, useEffect, createContext, useContext } from 'react';
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Dimensions, Platform, NativeModules } from 'react-native';

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

export const NavigationBarContext = createContext({
  isGestureNavigationEnabled: false,
  bottomInset: 0,
});

export const useNavigationBar = () => useContext(NavigationBarContext);

const NavigationBarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGestureNavigationEnabled, setIsGestureNavigationEnabled] = useState(false);
  const [bottomInset, setBottomInset] = useState(0);

  useEffect(() => {
    const detectGestureNavigation = async () => {
      if (Platform.OS === 'android') {
        try {
          
          const { height, width } = Dimensions.get('window');
          const screenHeight = Dimensions.get('screen').height;
          const aspectRatio = height / width;
          const windowToScreenRatio = height / screenHeight;
          
          const has3ButtonNavigation = windowToScreenRatio < 0.95;
          
          const likelyHasGestureNav = aspectRatio > 2.0 && !has3ButtonNavigation;
          
          if (has3ButtonNavigation) {
            setIsGestureNavigationEnabled(true); 
            setBottomInset(48); 
          } else if (likelyHasGestureNav) {
            setIsGestureNavigationEnabled(true);
            setBottomInset(20); 
          } else {
            setIsGestureNavigationEnabled(false);
            setBottomInset(0);
          }
        } catch (error) {
          console.warn('Error detecting navigation type:', error);
          setIsGestureNavigationEnabled(false);
          setBottomInset(0);
        }
      } else if (Platform.OS === 'ios') {
        const windowHeight = Dimensions.get('window').height;
        const screenHeight = Dimensions.get('screen').height;
        
        const hasHomeIndicator = screenHeight > windowHeight;
        setIsGestureNavigationEnabled(hasHomeIndicator);
        setBottomInset(hasHomeIndicator ? 20 : 0); 
      }
    };

    detectGestureNavigation();
    
    const orientationSubscription = Dimensions.addEventListener('change', detectGestureNavigation);
    
    return () => {
      orientationSubscription.remove();
    };
  }, []);

  return (
    <NavigationBarContext.Provider value={{ isGestureNavigationEnabled, bottomInset }}>
      {children}
    </NavigationBarContext.Provider>
  );
};

const DashboardTabs = () => {
  const { theme } = useTheme();
  const { isGestureNavigationEnabled, bottomInset } = useNavigationBar();
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
          paddingBottom: isGestureNavigationEnabled ? bottomInset : 0,
          ...(isGestureNavigationEnabled && {
            height: 60 + bottomInset,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            zIndex: 1000,
          }),
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

  useEffect(() => {
    if (getApps().length) {
      // console.log('Firebase initialized');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <ThemeProvider>
          <NotificationProvider>
            <SafeAreaProvider>
              <NavigationBarProvider>
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
              </NavigationBarProvider>
            </SafeAreaProvider>
          </NotificationProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App;