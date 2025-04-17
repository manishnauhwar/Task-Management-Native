import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import i18n, { saveLanguage } from '../i18n';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosinstance';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen = () => {
  const { theme, isDarkMode, setIsDarkMode } = useTheme();
  const navigation = useNavigation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const { t } = useTranslation();

  const languages = [
    { label: 'English', code: 'en' },
    { label: 'Hindi', code: 'hi' },
  ];

  // Save dark mode preference to AsyncStorage
  const handleThemeChange = async (value) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save theme preference:', error.message);
    }
  };

  // Handle language selection
  const handleLanguageChange = async (language) => {
    setSelectedLanguage(language.code);
    await saveLanguage(language.code);
    setShowLanguageModal(false);
  };

  // Update notification preferences on the backend and locally
  const updateNotificationPreferences = async (type, value) => {
    try {
      await axiosInstance.patch('/notifications/preferences', { [type]: value });
      // Also save to AsyncStorage
      await AsyncStorage.setItem(`notification_${type}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to update notification preferences:', error.message);
    }
  };

  // Fetch current preferences on component mount
  useEffect(() => {
    const loadStoredPreferences = async () => {
      try {
        // Load theme preference
        const storedTheme = await AsyncStorage.getItem('isDarkMode');
        if (storedTheme !== null) {
          setIsDarkMode(JSON.parse(storedTheme));
        }

        // Load notification preferences from local storage first
        const storedEmailPref = await AsyncStorage.getItem('notification_email');
        const storedAppPref = await AsyncStorage.getItem('notification_inApp');
        
        if (storedEmailPref !== null) {
          setEmailNotifications(JSON.parse(storedEmailPref));
        }
        
        if (storedAppPref !== null) {
          setAppNotifications(JSON.parse(storedAppPref));
        }

        // Then try to fetch from API to ensure we have the latest
        try {
          const res = await axiosInstance.get('/notifications/preferences');
          const prefs = res.data.preferences;
          setEmailNotifications(prefs.email);
          setAppNotifications(prefs.inApp);
          
          // Update local storage with latest from API
          await AsyncStorage.setItem('notification_email', JSON.stringify(prefs.email));
          await AsyncStorage.setItem('notification_inApp', JSON.stringify(prefs.inApp));
        } catch (apiError) {
          console.error('Error fetching notification preferences:', apiError.message);
          // Continue using locally stored preferences if API fails
        }
      } catch (error) {
        console.error('Error loading stored preferences:', error.message);
      }
    };

    loadStoredPreferences();
  }, [setIsDarkMode]);

  // Reusable render function for setting items
  const renderSettingItem = (title, description, value, onValueChange) => (
    <View style={[styles.settingCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: theme.placeholder }]}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={value ? theme.primary : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.appearance')}</Text>
        {renderSettingItem(
          t('settings.darkMode'),
          t('settings.darkModeDesc'),
          isDarkMode,
          handleThemeChange // Use the new handler that saves to AsyncStorage
        )}

        {/* Notification Preferences */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.notifications')}</Text>
        {renderSettingItem(
          t('settings.emailNotifications'),
          t('settings.emailDesc'),
          emailNotifications,
          () => {
            const newVal = !emailNotifications;
            setEmailNotifications(newVal);
            updateNotificationPreferences('email', newVal);
          }
        )}
        {renderSettingItem(
          t('settings.appNotifications'),
          t('settings.appDesc'),
          appNotifications,
          () => {
            const newVal = !appNotifications;
            setAppNotifications(newVal);
            updateNotificationPreferences('inApp', newVal);
          }
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.language')}</Text>
        <TouchableOpacity
          style={[styles.languageSelector, { backgroundColor: theme.cardBackground }]}
          onPress={() => {
            console.log('Language selector pressed');
            setShowLanguageModal(true);
          }}
        >
          <View style={styles.languageContent}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>{t('settings.selectedLanguage')}</Text>
            <Text style={[styles.selectedLanguage, { color: theme.placeholder }]}>
              {languages.find((lang) => lang.code === selectedLanguage)?.label || 'English'}
            </Text>
          </View>
          <Icon name="arrow-forward-ios" size={20} color={theme.text} />
        </TouchableOpacity>
      </ScrollView>

      {/* Language selection modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('settings.selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor:
                      selectedLanguage === language.code ? theme.primary + '20' : 'transparent',
                  },
                ]}
                onPress={() => handleLanguageChange(language)}
              >
                <Text style={[styles.languageText, { color: theme.text }]}>{language.label}</Text>
                {selectedLanguage === language.code && (
                  <Icon name="check" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  heading: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 32 },
  scrollContainer: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 12 },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 8,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingDescription: { fontSize: 14, marginTop: 4 },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 8,
  },
  languageContent: { flex: 1 },
  selectedLanguage: { fontSize: 14, marginTop: 4 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' },
  modalContent: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  languageText: { fontSize: 16 },
});

export default SettingsScreen;