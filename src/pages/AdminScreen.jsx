import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminMainScreen from '../components/admin/AdminMainScreen';
import TasksScreen from '../components/admin/TasksScreen';

const Stack = createStackNavigator();

const AdminScreen = () => {
  return (
    <Stack.Navigator initialRouteName="AdminMain" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminMainScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
    </Stack.Navigator>
  );
};

export default AdminScreen;