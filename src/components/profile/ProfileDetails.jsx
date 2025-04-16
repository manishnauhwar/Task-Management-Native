import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../utils/axiosinstance';

const ProfileDetails = ({ user, theme, onProfileUpdate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user.profilePictureUrl || null);
  const [editData, setEditData] = useState({
    fullname: user.fullname || '',
    email: user.email || '',
    password: ''
  });

  const editDetail = async () => {
    setModalOpen(false);
    if (!editData.fullname || !editData.email) {
      Alert.alert('Error', 'Please fill all required fields!');
      return;
    }

    try {
      const updateData = {
        fullname: editData.fullname,
        email: editData.email,
      };

      if (editData.password && editData.password.trim() !== '') {
        updateData.password = editData.password;
      }

      const response = await axiosInstance.put(
        `/users/${user.id}`,
        updateData
      );

      if (response.status === 200) {
        const updatedUser = {
          ...user,
          fullname: editData.fullname,
          email: editData.email,
        };

        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const updatedUserData = {
            ...parsedUserData,
            fullname: editData.fullname,
            email: editData.email,
          };
          await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUserData));
        }

        setEditData(prev => ({ ...prev, password: '' }));
        onProfileUpdate(updatedUser);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response) {
        switch (error.response.status) {
          case 400:
            Alert.alert('Error', 'Invalid data provided. Please check your inputs.');
            break;
          case 401:
            Alert.alert('Error', 'Session expired. Please login again.');
            break;
          case 409:
            Alert.alert('Error', 'Email already exists. Please use a different email.');
            break;
          default:
            Alert.alert('Error', 'An error occurred while updating the profile');
        }
      } else {
        Alert.alert('Error', 'Network error. Please check your connection.');
      }
    }
  };

  const handleImagePicker = () => {
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 500,
      maxWidth: 500,
      quality: 0.7,
    }, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.assets && response.assets.length > 0) {
        try {
          const asset = response.assets[0];
          const formData = new FormData();
          formData.append('profilePicture', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'profile.jpg',
          });

          const uploadResponse = await axiosInstance.post(
            `/users/${user.id}/profile-picture`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          if (uploadResponse.data && uploadResponse.data.profilePictureUrl) {
            const imageUrl = `${uploadResponse.data.profilePictureUrl}?t=${new Date().getTime()}`;
            setProfilePicture(imageUrl);
            
            const updatedUser = {
              ...user,
              profilePictureUrl: imageUrl
            };

            const userData = await AsyncStorage.getItem('@user_data');
            if (userData) {
              const parsedUserData = JSON.parse(userData);
              const updatedUserData = {
                ...parsedUserData,
                profilePicture: imageUrl
              };
              await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUserData));
            }

            onProfileUpdate(updatedUser);
            Alert.alert('Success', 'Profile picture updated successfully!');
          }
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          Alert.alert('Error', 'Error uploading profile picture. Please try again.');
        }
      } else {
        Alert.alert('Error', 'No image selected or image selection failed.');
      }
    });
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>User Details</Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.profilePictureContainer}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profilePicture}
              onError={(e) => {
                console.error('Error loading image:', e.nativeEvent.error);
                setProfilePicture(null);
              }}
            />
          ) : (
            <Icon name="account-circle" size={100} color={theme.text} />
          )}
          <View style={[styles.cameraIconContainer, { backgroundColor: theme.primary }]}>
            <Icon name="camera-alt" size={20} color={theme.buttonText} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.text, { color: theme.text }]}>Name: {user.fullname}</Text>
        <Text style={[styles.text, { color: theme.text }]}>Email: {user.email}</Text>
        <Text style={[styles.text, { color: theme.text }]}>Role: {user.role}</Text>
        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: theme.primary,
            shadowColor: theme.shadowColor,
          }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for editing profile */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Name"
              placeholderTextColor={theme.placeholder}
              value={editData.fullname}
              onChangeText={(text) => setEditData(prev => ({ ...prev, fullname: text }))}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              value={editData.email}
              onChangeText={(text) => setEditData(prev => ({ ...prev, email: text }))}
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="New Password (leave empty to keep current)"
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              value={editData.password}
              onChangeText={(text) => setEditData(prev => ({ ...prev, password: text }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: theme.primary,
                  shadowColor: theme.shadowColor,
                }]}
                onPress={editDetail}
              >
                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton, {
                  backgroundColor: theme.danger,
                  shadowColor: theme.shadowColor,
                }]}
                onPress={() => {
                  setModalOpen(false);
                  setEditData({
                    fullname: user.fullname,
                    email: user.email,
                    password: ''
                  });
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Cancel</Text>
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