import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  Modal, TextInput, Image, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../utils/axiosinstance';
import { useTranslation } from 'react-i18next';

const ProfileDetails = ({ user, theme, onProfileUpdate }) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user.profilePictureUrl);
  const [editData, setEditData] = useState({
    fullname: user.fullname, email: user.email, password: ''
  });

  const editDetail = async () => {
    setModalOpen(false);
    if (!editData.fullname || !editData.email) {
      return Alert.alert(t('common.error'), t('profile.requiredFields'));
    }
    try {
      const updateData = { fullname: editData.fullname, email: editData.email };
      if (editData.password.trim()) updateData.password = editData.password;
      const res = await axiosInstance.put(`/users/${user.id}`, updateData);
      if (res.status === 200) {
        const updatedUser = { ...user, ...updateData };
        const stored = await AsyncStorage.getItem('@user_data');
        if (stored) {
          const pd = JSON.parse(stored);
          await AsyncStorage.setItem('@user_data',
            JSON.stringify({ ...pd, ...updateData })
          );
        }
        setEditData(prev=>({...prev,password:''}));
        onProfileUpdate(updatedUser);
        Alert.alert(t('common.success'), t('profile.profileUpdated'));
      }
    } catch (err) {
      console.error(err);
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
    }
  };

  const handleImagePicker = () => {
    ImagePicker.launchImageLibrary({
      mediaType: 'photo', maxHeight:500, maxWidth:500, quality:0.7,
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
        const fd = new FormData();
        fd.append('profilePicture', {
          uri: asset.uri, type: asset.type, name: asset.fileName
        });
        const up = await axiosInstance.post(
          `/users/${user.id}/profile-picture`, fd,
          { headers:{ 'Content-Type':'multipart/form-data' }}
        );
        const url = up.data.profilePictureUrl + '?t=' + Date.now();
        setProfilePicture(url);
        // sync storage + parent
        const pu = { ...user, profilePictureUrl: url };
        const st = await AsyncStorage.getItem('@user_data');
        if (st) {
          const pd = JSON.parse(st);
          await AsyncStorage.setItem('@user_data',
            JSON.stringify({ ...pd, profilePictureUrl: url })
          );
        }
        onProfileUpdate(pu);
        Alert.alert(t('common.success'), t('profile.profilePictureUpdated'));
      } catch (e) {
        console.error(e);
        Alert.alert(t('common.error'), t('profile.uploadError'));
      }
    });
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color:theme.text }]}>
        {t('profile.userDetails')}
      </Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.profilePictureContainer}>
          {profilePicture
            ? <Image source={{ uri:profilePicture }} style={styles.profilePicture} />
            : <Icon name="account-circle" size={100} color={theme.text} />
          }
          <View style={[styles.cameraIconContainer, { backgroundColor:theme.primary }]}>
            <Icon name="camera-alt" size={20} color={theme.buttonText} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.text, { color:theme.text }]}>
          {t('profile.name')}: {user.fullname}
        </Text>
        <Text style={[styles.text, { color:theme.text }]}>
          {t('profile.email')}: {user.email}
        </Text>
        <Text style={[styles.text, { color:theme.text }]}>
          {t('profile.role')}: {user.role}
        </Text>
        <TouchableOpacity
          style={[styles.button,{ backgroundColor:theme.primary }]}
          onPress={()=>setModalOpen(true)}
        >
          <Text style={[styles.buttonText,{ color:theme.buttonText }]}>
            {t('profile.editProfile')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent,{ backgroundColor:theme.cardBackground }]}>
            <Text style={[styles.modalTitle,{ color:theme.text }]}>
              {t('profile.editProfile')}
            </Text>
            <TextInput
              style={[styles.input,{
                backgroundColor:theme.inputBackground,
                borderColor:theme.border, color:theme.text
              }]}
              placeholder={t('profile.name')}
              value={editData.fullname}
              onChangeText={text=>setEditData(p=>({...p,fullname:text}))}
              placeholderTextColor={theme.placeholder}
            />
            <TextInput
              style={[styles.input,{
                backgroundColor:theme.inputBackground,
                borderColor:theme.border, color:theme.text
              }]}
              placeholder={t('profile.email')}
              value={editData.email}
              onChangeText={text=>setEditData(p=>({...p,email:text}))}
              placeholderTextColor={theme.placeholder}
            />
            <TextInput
              style={[styles.input,{
                backgroundColor:theme.inputBackground,
                borderColor:theme.border, color:theme.text
              }]}
              placeholder="New Password (leave empty to keep current)"
              secureTextEntry
              value={editData.password}
              onChangeText={text=>setEditData(p=>({...p,password:text}))}
              placeholderTextColor={theme.placeholder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton,{ backgroundColor:theme.primary }]}
                onPress={editDetail}
              >
                <Text style={[styles.modalButtonText,{ color:theme.buttonText }]}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton,{ backgroundColor:theme.danger }]}
                onPress={()=>{
                  setModalOpen(false);
                  setEditData({ fullname:user.fullname, email:user.email, password:'' });
                }}
              >
                <Text style={[styles.modalButtonText,{ color:theme.buttonText }]}>
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
});

export default ProfileDetails;