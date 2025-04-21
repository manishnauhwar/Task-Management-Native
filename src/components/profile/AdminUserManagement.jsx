import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import axiosInstance from '../../utils/axiosinstance';
import { useTranslation } from 'react-i18next';

const pageSize = 5;

const AdminUserManagement = ({ allUsers, theme, onUsersUpdate }) => {
  const { t } = useTranslation();
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
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const totalPages = Math.max(1, Math.ceil(allUsers.length / pageSize));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allUsers.slice(start, start + pageSize);
  }, [allUsers, currentPage]);

  const handleCreateUser = async () => {
    if (!newUserData.fullname || !newUserData.email || !newUserData.password) {
      Alert.alert(t('common.error'), t('userManagement.fillRequiredFields'));
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        '/users/admin/create-user',
        newUserData
      );
      if (response.status === 201) {
        const u = response.data.user;
        const newUser = {
          id: u.id ?? u._id,
          fullname: u.fullname,
          email: u.email,
          role: u.role
        };
        const updated = [...allUsers, newUser];
        onUsersUpdate(updated);
        setNewUserData({ fullname: '', email: '', password: '', role: 'user' });
        setUserModalOpen(false);
        Alert.alert(t('common.success'), t('userManagement.userCreated'));
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Alert.alert(t('common.error'), t('userManagement.emailExists'));
      } else {
        Alert.alert(t('common.error'), t('userManagement.failedCreate'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserData.fullname || !selectedUserData.email) {
      Alert.alert(t('common.error'), t('userManagement.fillRequiredFields'));
      return;
    }
    try {
      setLoading(true);
      const updateData = {
        fullname: selectedUserData.fullname,
        email: selectedUserData.email,
        role: selectedUserData.role
      };
      if (selectedUserData.password.trim()) {
        updateData.password = selectedUserData.password;
      }
      const response = await axiosInstance.put(
        `/users/${selectedUserData.id}`,
        updateData
      );
      if (response.status === 200) {
        const updated = allUsers.map(u =>
          u.id === selectedUserData.id ? { ...u, ...updateData } : u
        );
        onUsersUpdate(updated);
        setSelectedUserData(null);
        setUserModalOpen(false);
        Alert.alert(t('common.success'), t('userManagement.userUpdated'));
      }
    } catch (error) {
      if (error.response?.status === 409) {
        Alert.alert(t('common.error'), t('userManagement.emailExists'));
      } else {
        Alert.alert(t('common.error'), t('userManagement.failedUpdate'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      t('userManagement.confirmDeleteTitle'),
      t('userManagement.confirmDeleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('userManagement.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              const response = await axiosInstance.delete(`/users/${userId}`);
              if (response.status === 200) {
                const updated = allUsers.filter(u => u.id !== userId);
                onUsersUpdate(updated);
                Alert.alert(t('common.success'), t('userManagement.userDeleted'));

                const newTotal = Math.ceil(updated.length / pageSize) || 1;
                setCurrentPage(cp => Math.min(cp, newTotal));
              }
            } catch {
              Alert.alert(t('common.error'), t('userManagement.failedDelete'));
            } finally {
              setActionLoading('');
            }
          }
        }
      ]
    );
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(cp => cp + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(cp => cp - 1);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
        {t('userManagement.title')}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary, marginTop: 15 }]}
        onPress={() => {
          setNewUserData({ fullname: '', email: '', password: '', role: 'user' });
          setIsNewUser(true);
          setUserModalOpen(true);
        }}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>
          {t('userManagement.addNewUser')}
        </Text>
      </TouchableOpacity>

      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        {allUsers.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {t('userManagement.noUsersFound')}
          </Text>
        ) : (
          <>
            {paginatedUsers.map(item => (
              <View
                key={item.id.toString()}
                style={[styles.userItem, { borderBottomColor: theme.border }]}
              >
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {item.fullname}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.text }]}>
                    {item.email}
                  </Text>
                  <View style={[styles.roleBadge, {
                    backgroundColor:
                      item.role === 'admin'
                        ? theme.danger + '15'
                        : item.role === 'manager'
                          ? theme.warning + '15'
                          : theme.success + '15'
                  }]}>
                    <Text style={[styles.roleText, {
                      color:
                        item.role === 'admin'
                          ? theme.danger
                          : item.role === 'manager'
                            ? theme.warning
                            : theme.success
                    }]}>
                      {t(`userManagement.roles.${item.role}`)}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  {actionLoading === item.id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUserData({ ...item, password: '' });
                          setIsNewUser(false);
                          setUserModalOpen(true);
                        }}
                        disabled={loading}
                      >
                        <Text style={{ color: theme.primary }}>
                          {t('userManagement.edit')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteUser(item.id)}
                        disabled={loading}
                      >
                        <Text style={{ color: theme.danger }}>
                          {t('userManagement.delete')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={goToPrevPage}
                disabled={currentPage === 1 || loading}
                style={{ opacity: currentPage === 1 || loading ? 0.5 : 1 }}
              >
                <Text style={{ color: theme.primary }}>
                  {t('userManagement.prev')}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: theme.text }}>
                {t('userManagement.pageInfo', { current: currentPage, total: totalPages })}
              </Text>
              <TouchableOpacity
                onPress={goToNextPage}
                disabled={currentPage === totalPages || loading}
                style={{ opacity: currentPage === totalPages || loading ? 0.5 : 1 }}
              >
                <Text style={{ color: theme.primary }}>
                  {t('userManagement.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Modal for Create / Edit */}
      <Modal visible={userModalOpen} animationType="slide" transparent>
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isNewUser
                ? t('userManagement.createUser')
                : t('userManagement.editUser')}
            </Text>

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder={t('userManagement.fullName')}
              placeholderTextColor={theme.placeholder}
              value={isNewUser ? newUserData.fullname : selectedUserData?.fullname}
              onChangeText={text =>
                isNewUser
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
              placeholder={t('userManagement.email')}
              placeholderTextColor={theme.placeholder}
              value={isNewUser ? newUserData.email : selectedUserData?.email}
              onChangeText={text =>
                isNewUser
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
              placeholder={
                isNewUser
                  ? t('userManagement.password')
                  : t('userManagement.newPassword')
              }
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              value={isNewUser ? newUserData.password : selectedUserData?.password}
              onChangeText={text =>
                isNewUser
                  ? setNewUserData(prev => ({ ...prev, password: text }))
                  : setSelectedUserData(prev => ({ ...prev, password: text }))
              }
            />

            <Text style={[styles.inputLabel, { color: theme.text }]}>
              {t('userManagement.role')}
            </Text>
            <View style={styles.roleSelection}>
              {['user', 'manager', 'admin'].map(role => {
                const selectedRole = isNewUser
                  ? newUserData.role
                  : selectedUserData?.role;
                const isSelected = selectedRole === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, {
                      backgroundColor: isSelected
                        ? theme[role === 'admin'
                            ? 'danger'
                            : role === 'manager'
                              ? 'warning'
                              : 'success'
                          ] + '15'
                        : theme.inputBackground,
                      borderColor: theme.border
                    }]}
                    onPress={() =>
                      isNewUser
                        ? setNewUserData(prev => ({ ...prev, role }))
                        : setSelectedUserData(prev => ({ ...prev, role }))
                    }
                  >
                    <Text style={[styles.roleOptionText, {
                      color: isSelected
                        ? theme[role === 'admin'
                            ? 'danger'
                            : role === 'manager'
                              ? 'warning'
                              : 'success'
                          ]
                        : theme.textSecondary
                    }]}>
                      {t(`userManagement.roles.${role}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {
                  backgroundColor: theme.primary,
                  shadowColor: theme.shadowColor,
                  opacity: loading ? 0.7 : 1
                }]}
                onPress={isNewUser ? handleCreateUser : handleUpdateUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.buttonText} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>
                    {isNewUser
                      ? t('userManagement.createUser')
                      : t('userManagement.updateUser')}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelModalButton, {
                  backgroundColor: theme.danger,
                  shadowColor: theme.shadowColor,
                  opacity: loading ? 0.7 : 1
                }]}
                onPress={() => {
                  setUserModalOpen(false);
                  if (isNewUser) {
                    setNewUserData({ fullname: '', email: '', password: '', role: 'user' });
                  } else {
                    setSelectedUserData(null);
                  }
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
    </ScrollView>
  );
};

export default AdminUserManagement;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingHorizontal: 15 // Add padding to align with button
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold',
    marginBottom: 15
  },
  button: { 
    padding: 10, 
    borderRadius: 8, 
    alignItems: 'center',
    marginBottom: 15
  },
  buttonText: { fontSize: 16 },
  contentCard: { 
    padding: 10, 
    borderWidth: 1, 
    borderRadius: 8 
  },
  emptyText: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginVertical: 20 
  },
  userItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  userInfo: { flex: 1 },
  userName: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  userEmail: { 
    fontSize: 14,
    marginTop: 2
  },
  roleBadge: { 
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4
  },
  roleText: { 
    fontSize: 12, 
    fontWeight: '500' 
  },
  userActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15,
    marginLeft: 10
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#00000055'
  },
  modalContent: {
    margin: 20,
    borderRadius: 8,
    padding: 20,
    elevation: 5
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10
  },
  inputLabel: { fontSize: 14, marginBottom: 6 },
  roleSelection: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  roleOption: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6
  },
  roleOptionText: { fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 5
  },
  cancelModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 5
  }
});
