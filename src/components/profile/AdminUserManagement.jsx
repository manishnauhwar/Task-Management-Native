import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import axiosInstance from '../../utils/axiosinstance';

const pageSize = 5;

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
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(allUsers.length / pageSize);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allUsers.slice(start, start + pageSize);
  }, [allUsers, currentPage, pageSize]);

  const handleCreateUser = async () => {
    if (!newUserData.fullname || !newUserData.email || !newUserData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const response = await axiosInstance.post('/users/admin/create-user', newUserData);
      if (response.status === 201) {
        const newUser = {
          id: response.data.user.id || response.data.user._id,
          fullname: response.data.user.fullname,
          email: response.data.user.email,
          role: response.data.user.role
        };
        
        const updatedUsers = [...allUsers, newUser];
        onUsersUpdate(updatedUsers);
        
        // Reset form
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

      const response = await axiosInstance.put(`/users/${selectedUserData.id}`, updateData);
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
                
                // Adjust current page if the deletion removes the last item on the last page
                const newTotalPages = Math.ceil(updatedUsers.length / pageSize);
                if (currentPage > newTotalPages && newTotalPages > 0) {
                  setCurrentPage(newTotalPages);
                } else if (newTotalPages === 0) {
                  setCurrentPage(1);
                }
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

  // Render each user item showing only name, email, and role
  const renderUserItem = ({ item }) => (
    <View style={[styles.userItem, { borderBottomColor: theme.border }]}>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>{item.fullname}</Text>
        <Text style={[styles.userEmail, { color: theme.text }]}>{item.email}</Text>
        <View style={[styles.roleBadge, {
          backgroundColor:
            item.role === 'admin' ? theme.danger + '30' :
            item.role === 'manager' ? theme.warning + '30' :
            theme.success + '30'
        }]}>
          <Text style={[styles.roleText, {
            color:
              item.role === 'admin' ? theme.danger :
              item.role === 'manager' ? theme.warning :
              theme.success
          }]}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          onPress={() => {
            setSelectedUserData({
              id: item.id,
              fullname: item.fullname,
              email: item.email,
              role: item.role,
              password: ''
            });
            setIsNewUser(false);
            setUserModalOpen(true);
          }}
        >
          <Text style={{ color: theme.primary }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteUser(item.id)}>
          <Text style={{ color: theme.danger }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Handlers for pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>User Management</Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        {allUsers.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.text }]}>No users found.</Text>
        ) : (
          <>
            <FlatList
              data={paginatedUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
            />
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={goToPrevPage}
                disabled={currentPage === 1}
                style={[styles.paginationButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
              >
                <Text style={{ color: theme.primary }}>Prev</Text>
              </TouchableOpacity>
              <Text style={{ color: theme.text }}>
                Page {currentPage} of {totalPages || 1}
              </Text>
              <TouchableOpacity
                onPress={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                style={[styles.paginationButton, { opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1 }]}
              >
                <Text style={{ color: theme.primary }}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
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
              {['user', 'manager', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor:
                        (isNewUser ? newUserData.role : selectedUserData?.role) === role
                          ? theme[role === 'admin' ? 'danger' : role === 'manager' ? 'warning' : 'success'] + '30'
                          : theme.inputBackground,
                      borderColor: theme.border
                    }
                  ]}
                  onPress={() => isNewUser
                    ? setNewUserData(prev => ({ ...prev, role }))
                    : setSelectedUserData(prev => ({ ...prev, role }))
                  }
                >
                  <Text style={[
                    styles.roleOptionText,
                    {
                      color:
                        (isNewUser ? newUserData.role : selectedUserData?.role) === role
                          ? theme[role === 'admin' ? 'danger' : role === 'manager' ? 'warning' : 'success']
                          : theme.textSecondary
                    }
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
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
    </View>
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
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