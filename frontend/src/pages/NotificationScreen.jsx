import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const NotificationScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { notifications, clearNotification, markAllAsRead, clearAllNotifications } = useNotification();

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No notifications yet
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderLeftColor: notification.read ? theme.border : theme.primary,
                  borderLeftWidth: 4,
                }
              ]}
              onPress={() => clearNotification(notification.id)}
            >
              <Text style={[styles.notificationTitle, { color: theme.text }]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationBody, { color: theme.text }]}>
                {notification.message}
              </Text>
              <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                {formatDate(notification.timestamp)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {notifications.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={markAllAsRead}
          >
            <Text style={styles.actionButtonText}>Mark All as Read</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            onPress={clearAllNotifications}
          >
            <Text style={styles.actionButtonText}>Delete All</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 16,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 150,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationScreen;
