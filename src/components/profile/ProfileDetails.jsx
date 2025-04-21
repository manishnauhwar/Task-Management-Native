import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Modal, TextInput, Image, Alert, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../utils/axiosinstance';
import { useTranslation } from 'react-i18next';

const baseURL = 'https://taskmanagement-backend-2.onrender.com';
// const baseURL = 'http://10.0.2.2:5000';

const ProfileDetails = ({ user, theme, onProfileUpdate }) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [editData, setEditData] = useState({
    fullname: '', email: '', password: ''
  });
  
  useEffect(() => {
    if (user) {
      if (user.googleProfilePictureUrl) {
        setProfilePicture(user.googleProfilePictureUrl);
      } else if (user.profilePictureUrl) {
        setProfilePicture(`${baseURL}${user.profilePictureUrl}`);
      } else {
        setProfilePicture(null);
      }
      
      setEditData({
        fullname: user.fullname || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);

  const editDetail = async () => {
    if (!editData.fullname || !editData.email) {
      return Alert.alert(t('common.error'), t('profile.requiredFields'));
    }
    try {
      setLoading(true);
      const updateData = { fullname: editData.fullname, email: editData.email };
      if (editData.password.trim()) updateData.password = editData.password;
      
      // Make sure we have a valid user ID
      const userId = user.id || user._id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      console.log('Updating user details for ID:', userId);
      
      const res = await axiosInstance.put(`/users/${userId}`, updateData);
      if (res.status === 200) {
        const updatedUser = { ...user, ...updateData };
        const stored = await AsyncStorage.getItem('@user_data');
        if (stored) {
          const pd = JSON.parse(stored);
          await AsyncStorage.setItem('@user_data',
            JSON.stringify({ ...pd, ...updateData })
          );
        }
        setEditData(prev => ({ ...prev, password: '' }));
        onProfileUpdate(updatedUser);
        setModalOpen(false);
        Alert.alert(t('common.success'), t('profile.profileUpdated'));
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const st = err.response?.status;
      if (st === 400) {
        Alert.alert(t('common.error'), t('profile.invalidData'));
      } else if (st === 401) {
        Alert.alert(t('common.error'), t('profile.sessionExpired'));
      } else if (st === 409) {
        Alert.alert(t('common.error'), t('profile.emailExists'));
      } else {
        Alert.alert(t('common.error'), t('profile.profileUpdateError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = () => {
    // Check if this is a Google user
    const isGoogleUser = !!user.googleProfilePictureUrl;
    
    if (isGoogleUser) {
      return Alert.alert(
        t('common.info'),
        t('profile.googleProfilePictureInfo'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    }
    
    ImagePicker.launchImageLibrary({
      mediaType: 'photo', maxHeight: 500, maxWidth: 500, quality: 0.7,
    }, async (res) => {
      if (res.didCancel) {
        return console.log('User cancelled image picker');
      }
      if (res.error) {
        console.log(res.error);
        return Alert.alert(t('common.error'), t('profile.uploadError'));
      }
      const asset = res.assets?.[0];
      if (!asset) {
        return Alert.alert(t('common.error'), t('profile.noImage'));
      }
      try {
        setImageLoading(true);
        const fd = new FormData();
        fd.append('profilePicture', {
          uri: asset.uri, type: asset.type, name: asset.fileName
        });
        
        // Make sure we have a valid user ID
        const userId = user.id || user._id;
        
        if (!userId) {
          throw new Error('User ID not found');
        }
        
        console.log('Uploading profile picture for user ID:', userId);
        
        const up = await axiosInstance.post(
          `/users/${userId}/profile-picture`, fd,
          { headers: { 'Content-Type': 'multipart/form-data' }}
        );
        
        const newProfilePictureUrl = up.data.profilePictureUrl 
          ? `${baseURL}${up.data.profilePictureUrl}` 
          : null;
        
        setProfilePicture(newProfilePictureUrl);

        const pu = { 
          ...user,
          profilePictureUrl: up.data.profilePictureUrl 
        };
        
        const st = await AsyncStorage.getItem('@user_data');
        if (st) {
          const pd = JSON.parse(st);
          await AsyncStorage.setItem('@user_data',
            JSON.stringify({ 
              ...pd,
              profilePictureUrl: up.data.profilePictureUrl 
            })
          );
        }
        onProfileUpdate(pu);
        Alert.alert(t('common.success'), t('profile.profilePictureUpdated'));
      } catch (e) {
        console.error('Profile picture upload error:', e);
        Alert.alert(t('common.error'), t('profile.uploadError'));
      } finally {
        setImageLoading(false);
      }
    });
  };

  // Check if user data is available
  if (!user || !user.fullname) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.text, { color: theme.text }]}>
          {t('profile.noUserDataAvailable')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {t('profile.userDetails')}
      </Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.profilePictureContainer} disabled={imageLoading}>
          {imageLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          ) : (
            <Icon name="account-circle" size={100} color={theme.text} />
          )}
          <View style={[styles.cameraIconContainer, { backgroundColor: theme.primary }]}>
            <Icon name="camera-alt" size={20} color={theme.buttonText} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.text, { color: theme.text }]}>
          {t('profile.name')}: {user.fullname}
        </Text>
        <Text style={[styles.text, { color: theme.text }]}>
          {t('profile.email')}: {user.email}
        </Text>
        <Text style={[styles.text, { color: theme.text }]}>
          {t('profile.role')}: {user.role}
        </Text>
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: theme.primary,
            opacity: loading ? 0.7 : 1 
          }]}
          onPress={() => setModalOpen(true)}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {t('profile.editProfile')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('profile.editProfile')}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border, color: theme.text
              }]}
              placeholder={t('profile.name')}
              value={editData.fullname}
              onChangeText={text => setEditData(p => ({ ...p, fullname: text }))}
              placeholderTextColor={theme.placeholder}
              editable={!loading}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border, color: theme.text
              }]}
              placeholder={t('profile.email')}
              value={editData.email}
              onChangeText={text => setEditData(p => ({ ...p, email: text }))}
              placeholderTextColor={theme.placeholder}
              editable={!loading}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border, color: theme.text
              }]}
              placeholder="New Password (leave empty to keep current)"
              secureTextEntry
              value={editData.password}
              onChangeText={text => setEditData(p => ({ ...p, password: text }))}
              placeholderTextColor={theme.placeholder}
              editable={!loading}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { 
                  backgroundColor: theme.primary,
                  opacity: loading ? 0.7 : 1
                }]}
                onPress={editDetail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.buttonText} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>
                    {t('common.save')}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton, { 
                  backgroundColor: theme.danger,
                  opacity: loading ? 0.7 : 1
                }]}
                onPress={() => {
                  setModalOpen(false);
                  setEditData({
                    fullname: user.fullname || '',
                    email: user.email || '',
                    password: ''
                  });
                }}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: '32%',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginRight: 5,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelModalButton: {
    flex: 1,
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginLeft: 5,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default ProfileDetails;