// NotificationScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from "react-i18next";
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { notifications, markNotificationAsRead, deleteNotification } = useNotification();
  const { t } = useTranslation();

  // const formatDate = (date) => new Date(date).toLocaleString();
  // const formatDate = (date) => {
  //   const d = new Date(date);
  //   return isNaN(d) ? 'N/A' : d.toLocaleString();
  // };

  const getNotificationColor = () => '#4CAF50';

  const handleDeleteNotification = (id) => {
    Alert.alert(
      t('notifications.deleteTitle'),
      t('notifications.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteNotification(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? 'light-content' : 'dark-content'}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>{t('notifications.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {t('notifications.noNotifications')}
            </Text>

          </View>
        ) : (
          notifications.map((notification, index) => (
            <TouchableOpacity
              key={notification._id || notification.id || index}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderLeftColor: notification.read ? theme.border : getNotificationColor(),
                  borderLeftWidth: 4,
                },
              ]}
              onPress={() =>
                markNotificationAsRead(notification._id || notification.id)
              }
            >
              <Text style={[styles.notificationTitle, { color: theme.text }]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationBody, { color: theme.text }]}>
                {notification.message}
              </Text>
              {/* <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                {formatDate(notification.timestamp)}
              </Text> */}
              <View style={styles.deleteIcon}>
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteNotification(notification._id || notification.id)
                  }
                >
                  <Icon name="delete" size={20} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { padding: 8, width: 40 },
  placeholder: { width: 40 },
  heading: { fontSize: 26, fontWeight: '800', flex: 1, textAlign: 'center' },
  scrollContainer: { flexGrow: 1, paddingBottom: 80, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notificationCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  notificationTitle: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  notificationBody: { fontSize: 16, marginBottom: 8 },
  notificationTime: { fontSize: 12 },
  emptyText: { textAlign: 'center', fontSize: 16 },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default NotificationScreen;
