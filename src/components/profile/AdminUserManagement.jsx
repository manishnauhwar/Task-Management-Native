import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from '../../utils/axiosinstance';

const AdminUserManagement = ({ allUsers, theme, onUsersUpdate }) => {
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [newUserData, setNewUserData] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [isNewUser, setIsNewUser] = useState(false);

  const handleCreateUser = async () => {
    if (!newUserData.fullname || !newUserData.email || !newUserData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const response = await axiosInstance.post('/users/admin/create-user', newUserData);

      if (response.status === 201) {
        const updatedUsers = [...allUsers, response.data.user];
        onUsersUpdate(updatedUsers);
        setNewUserData({
          fullname: '',
          email: '',
          password: '',
          role: 'user'
        });
        setUserModalOpen(false);
        Alert.alert('Success', 'User created successfully!');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.status === 409) {
        Alert.alert('Error', 'Email already exists. Please use a different email.');
      } else {
        Alert.alert('Error', 'Failed to create user. Please try again.');
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserData.fullname || !selectedUserData.email) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const updateData = {
        fullname: selectedUserData.fullname,
        email: selectedUserData.email,
        role: selectedUserData.role
      };

      if (selectedUserData.password && selectedUserData.password.trim() !== '') {
        updateData.password = selectedUserData.password;
      }

      const response = await axiosInstance.put(
        `/users/${selectedUserData.id}`,
        updateData
      );

      if (response.status === 200) {
        const updatedUsers = allUsers.map(user =>
          user.id === selectedUserData.id ? { ...user, ...updateData } : user
        );
        onUsersUpdate(updatedUsers);
        setSelectedUserData(null);
        setUserModalOpen(false);
        Alert.alert('Success', 'User updated successfully!');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.status === 409) {
        Alert.alert('Error', 'Email already exists. Please use a different email.');
      } else {
        Alert.alert('Error', 'Failed to update user. Please try again.');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axiosInstance.delete(`/users/${userId}`);
              if (response.status === 200) {
                const updatedUsers = allUsers.filter(user => user.id !== userId);
                onUsersUpdate(updatedUsers);
                Alert.alert('Success', 'User deleted successfully!');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>User Management</Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        {allUsers.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.text }]}>No users found.</Text>
        ) : (
          allUsers.map(u => (
            <View key={u.id} style={[styles.userItem, { borderBottomColor: theme.border }]}>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{u.fullname}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{u.email}</Text>
                <View style={[styles.roleBadge, {
                  backgroundColor:
                    u.role === 'admin' ? theme.danger + '30' :
                    u.role === 'manager' ? theme.warning + '30' :
                    theme.success + '30'
                }]}>
                  <Text style={[styles.roleText, {
                    color:
                      u.role === 'admin' ? theme.danger :
                      u.role === 'manager' ? theme.warning :
                      theme.success
                  }]}>{u.role}</Text>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity onPress={() => {
                  setSelectedUserData({
                    id: u.id,
                    fullname: u.fullname,
                    email: u.email,
                    role: u.role,
                    password: ''
                  });
                  setIsNewUser(false);
                  setUserModalOpen(true);
                }}>
                  <Text style={{ color: theme.primary }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteUser(u.id)}>
                  <Text style={{ color: theme.danger }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, marginTop: 15 }]}
          onPress={() => {
            setNewUserData({
              fullname: '',
              email: '',
              password: '',
              role: 'user'
            });
            setIsNewUser(true);
            setUserModalOpen(true);
          }}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Add New User</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for user creation/editing */}
      <Modal visible={userModalOpen} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isNewUser ? 'Add New User' : 'Edit User'}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Full Name"
              placeholderTextColor={theme.placeholder}
              value={isNewUser ? newUserData.fullname : selectedUserData?.fullname}
              onChangeText={(text) => isNewUser
                ? setNewUserData(prev => ({ ...prev, fullname: text }))
                : setSelectedUserData(prev => ({ ...prev, fullname: text }))
              }
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              value={isNewUser ? newUserData.email : selectedUserData?.email}
              onChangeText={(text) => isNewUser
                ? setNewUserData(prev => ({ ...prev, email: text }))
                : setSelectedUserData(prev => ({ ...prev, email: text }))
              }
            />
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder={isNewUser ? "Password" : "New Password (leave empty to keep current)"}
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              value={isNewUser ? newUserData.password : selectedUserData?.password}
              onChangeText={(text) => isNewUser
                ? setNewUserData(prev => ({ ...prev, password: text }))
                : setSelectedUserData(prev => ({ ...prev, password: text }))
              }
            />

            <Text style={[styles.inputLabel, { color: theme.text }]}>Role</Text>
            <View style={styles.roleSelection}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: (isNewUser ? newUserData.role : selectedUserData?.role) === 'user'
                      ? theme.success + '30'
                      : theme.inputBackground,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => isNewUser
                  ? setNewUserData(prev => ({ ...prev, role: 'user' }))
                  : setSelectedUserData(prev => ({ ...prev, role: 'user' }))
                }
              >
                <Text style={[
                  styles.roleOptionText,
                  {
                    color: (isNewUser ? newUserData.role : selectedUserData?.role) === 'user'
                      ? theme.success
                      : theme.textSecondary
                  }
                ]}>User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: (isNewUser ? newUserData.role : selectedUserData?.role) === 'manager'
                      ? theme.warning + '30'
                      : theme.inputBackground,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => isNewUser
                  ? setNewUserData(prev => ({ ...prev, role: 'manager' }))
                  : setSelectedUserData(prev => ({ ...prev, role: 'manager' }))
                }
              >
                <Text style={[
                  styles.roleOptionText,
                  {
                    color: (isNewUser ? newUserData.role : selectedUserData?.role) === 'manager'
                      ? theme.warning
                      : theme.textSecondary
                  }
                ]}>Manager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: (isNewUser ? newUserData.role : selectedUserData?.role) === 'admin'
                      ? theme.danger + '30'
                      : theme.inputBackground,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => isNewUser
                  ? setNewUserData(prev => ({ ...prev, role: 'admin' }))
                  : setSelectedUserData(prev => ({ ...prev, role: 'admin' }))
                }
              >
                <Text style={[
                  styles.roleOptionText,
                  {
                    color: (isNewUser ? newUserData.role : selectedUserData?.role) === 'admin'
                      ? theme.danger
                      : theme.textSecondary
                  }
                ]}>Admin</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: theme.primary,
                  shadowColor: theme.shadowColor,
                }]}
                onPress={isNewUser ? handleCreateUser : handleUpdateUser}
              >
                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>
                  {isNewUser ? 'Create User' : 'Update User'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton, {
                  backgroundColor: theme.danger,
                  shadowColor: theme.shadowColor,
                }]}
                onPress={() => {
                  setUserModalOpen(false);
                  if (isNewUser) {
                    setNewUserData({
                      fullname: '',
                      email: '',
                      password: '',
                      role: 'user'
                    });
                  } else {
                    setSelectedUserData(null);
                  }
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
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 10,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  roleOptionText: {
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminUserManagement;