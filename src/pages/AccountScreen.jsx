import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';
import { logout } from '../utils/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '@react-native-firebase/app';


const AccountScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { unreadCount } = useNotification();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout(); 
              try {
                await AsyncStorage.multiRemove(['@auth_token', '@user_data', '@refresh_token']);
              } catch (storageError) {
                console.error('AsyncStorage clear error:', storageError);
              }

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);

              
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.statusBarStyle}
      />
      <Text style={[styles.heading, { color: theme.text }]}>Account</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity
          style={[styles.link, { borderBottomColor: theme.divider }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="account" size={24} color={theme.primary} />
          <Text style={[styles.text, { color: theme.text }]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.link, { borderBottomColor: theme.divider }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.iconContainer}>
            <Icon name="bell" size={24} color={theme.warning} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.text, { color: theme.text }]}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.link, { borderBottomColor: theme.divider }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog" size={24} color={theme.success} />
          <Text style={[styles.text, { color: theme.text }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.danger }]}
          onPress={handleLogout}
        >
          <View style={styles.linkContent}>
            <Icon name="logout" size={24} color={theme.buttonText} />
            <Text style={[styles.logoutText, { color: theme.buttonText }]}>
              Logout
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 15,
    textAlign: 'center',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  text: {
    fontSize: 18,
    marginLeft: 10,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  logoutButton: {
    width: '40%',
    marginTop: 40,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
