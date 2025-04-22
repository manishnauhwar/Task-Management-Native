import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from '../../utils/axiosinstance';
import { useTranslation } from 'react-i18next';

const ManagerTeamManagement = ({ teams, user, theme, onTeamsUpdate }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isTeamDetailsModalVisible, setIsTeamDetailsModalVisible] = useState(false);
  const [isCreateTeamModalVisible, setIsCreateTeamModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeModalView, setActiveModalView] = useState('team'); // 'team', 'current', 'available'

  const fetchAvailableUsers = async () => {
    try {
      const response = await axiosInstance.get('/users/alluser', {
        params: { fields: 'id,fullname,email,role' }
      });

      if (response.data && Array.isArray(response.data.allUsers)) {
        const filteredUsers = response.data.allUsers.filter(u => 
          u.role === 'user' && u.id !== user.id && (!selectedTeam || 
          !selectedTeam.members || 
          !selectedTeam.members.some(m => (m._id || m.id) === (u._id || u.id)))
        );

        setAvailableUsers(filteredUsers.map(u => ({
          id: u.id || u._id,
          fullname: u.fullname,
          email: u.email,
          role: u.role
        })));
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      Alert.alert(t('common.error'), t('teamManagement.errorFetchingUsers'));
    }
  };

  const handleTeamPress = (team) => {
    setSelectedTeam(team);
    setTeamMembers(team.members || []);
    setIsTeamDetailsModalVisible(true);
    setActiveModalView('team');
    fetchAvailableUsers();
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      return Alert.alert(t('common.error'), t('teamManagement.teamNameRequired'));
    }

    try {
      setLoading(prev => ({ ...prev, createTeam: true }));
      const response = await axiosInstance.post('/teams', {
        name: newTeamName,
        managerId: user.id,
        memberIds: selectedUsers
      });

      if (response.data) {
        onTeamsUpdate([...teams, response.data]);
        
        setNewTeamName('');
        setSelectedUsers([]);
        setIsCreateTeamModalVisible(false);
        
        Alert.alert(t('common.success'), t('teamManagement.teamCreated'));
      }
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert(t('common.error'), t('teamManagement.errorCreatingTeam'));
    } finally {
      setLoading(prev => ({ ...prev, createTeam: false }));
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, [userId]: true }));
      
      const updatedMembers = [...(selectedTeam.members?.map(m => m._id || m.id) || []), userId];
      
      const response = await axiosInstance.put(`/teams/${selectedTeam._id || selectedTeam.id}`, {
        memberIds: updatedMembers
      });

      if (response.data) {
        const updatedTeams = teams.map(team => 
          (team._id || team.id) === (selectedTeam._id || selectedTeam.id) ? response.data : team
        );
        
        onTeamsUpdate(updatedTeams);
        setSelectedTeam(response.data);
        setTeamMembers(response.data.members || []);
        
        // Remove the added user from available users
        setAvailableUsers(availableUsers.filter(u => u.id !== userId));
        
        Alert.alert(t('common.success'), t('teamManagement.memberAdded'));
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      Alert.alert(t('common.error'), t('teamManagement.errorAddingMember'));
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, [userId]: true }));
      
      const updatedMembers = selectedTeam.members
        .filter(m => (m._id || m.id) !== userId)
        .map(m => m._id || m.id);
      
      const response = await axiosInstance.put(`/teams/${selectedTeam._id || selectedTeam.id}`, {
        memberIds: updatedMembers
      });

      if (response.data) {
        const updatedTeams = teams.map(team => 
          (team._id || team.id) === (selectedTeam._id || selectedTeam.id) ? response.data : team
        );
        
        onTeamsUpdate(updatedTeams);
        setSelectedTeam(response.data);
        setTeamMembers(response.data.members || []);
        
        fetchAvailableUsers();
        
        Alert.alert(t('common.success'), t('teamManagement.memberRemoved'));
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      Alert.alert(t('common.error'), t('teamManagement.errorRemovingMember'));
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const openCreateTeamModal = () => {
    fetchAvailableUsers();
    setIsCreateTeamModalVisible(true);
  };

  const renderTeamDetails = () => {
    return (
      <>
        <View style={styles.modalTabContainer}>
          <TouchableOpacity 
            style={[
              styles.modalTab, 
              activeModalView === 'team' && { 
                borderBottomColor: theme.primary,
                borderBottomWidth: 2 
              }
            ]}
            onPress={() => setActiveModalView('team')}
          >
            <Text style={[
              styles.modalTabText, 
              { color: activeModalView === 'team' ? theme.primary : theme.textSecondary }
            ]}>
              {t('teamManagement.team')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.modalTab, 
              activeModalView === 'current' && { 
                borderBottomColor: theme.primary,
                borderBottomWidth: 2 
              }
            ]}
            onPress={() => setActiveModalView('current')}
          >
            <Text style={[
              styles.modalTabText, 
              { color: activeModalView === 'current' ? theme.primary : theme.textSecondary }
            ]}>
              {t('teamManagement.currentMembers')} ({teamMembers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.modalTab, 
              activeModalView === 'available' && { 
                borderBottomColor: theme.primary,
                borderBottomWidth: 2 
              }
            ]}
            onPress={() => setActiveModalView('available')}
          >
            <Text style={[
              styles.modalTabText, 
              { color: activeModalView === 'available' ? theme.primary : theme.textSecondary }
            ]}>
              {t('teamManagement.availableMembers')} ({availableUsers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeModalView === 'team' && (
          <View style={styles.teamInfoContainer}>
            <Text style={[styles.teamInfoLabel, { color: theme.textSecondary }]}>
              {t('teamManagement.teamName')}:
            </Text>
            <Text style={[styles.teamInfoValue, { color: theme.text }]}>
              {selectedTeam?.name}
            </Text>
            <Text style={[styles.teamInfoLabel, { color: theme.textSecondary, marginTop: 15 }]}>
              {t('teamManagement.memberCount')}:
            </Text>
            <Text style={[styles.teamInfoValue, { color: theme.text }]}>
              {teamMembers.length}
            </Text>
          </View>
        )}

        {activeModalView === 'current' && (
          teamMembers.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('teamManagement.noMembersInTeam')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={teamMembers}
              keyExtractor={(item) => (item._id || item.id).toString()}
              renderItem={({ item }) => (
                <View style={[styles.memberItem, { borderBottomColor: theme.border }]}>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {item.fullname}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                      {item.email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.danger }]}
                    onPress={() => handleRemoveMember(item._id || item.id)}
                    disabled={loading[item._id || item.id]}
                  >
                    {loading[item._id || item.id] ? (
                      <ActivityIndicator size="small" color={theme.buttonText} />
                    ) : (
                      <Icon name="remove" size={18} color={theme.buttonText} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
              style={styles.membersList}
            />
          )
        )}

        {activeModalView === 'available' && (
          availableUsers.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('teamManagement.noAvailableUsers')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.memberItem, { borderBottomColor: theme.border }]}>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {item.fullname}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                      {item.email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.success }]}
                    onPress={() => handleAddMember(item.id)}
                    disabled={loading[item.id]}
                  >
                    {loading[item.id] ? (
                      <ActivityIndicator size="small" color={theme.buttonText} />
                    ) : (
                      <Icon name="add" size={18} color={theme.buttonText} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
              style={styles.membersList}
            />
          )
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {t('teamManagement.yourTeams')}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={openCreateTeamModal}
        >
          <Icon name="add" size={18} color={theme.buttonText} />
          <Text style={[styles.createButtonText, { color: theme.buttonText }]}>
            {t('teamManagement.createTeam')}
          </Text>
        </TouchableOpacity>
      </View>

      {teams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="group" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {t('teamManagement.noTeams')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.teamItem, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => handleTeamPress(item)}
            >
              <View style={styles.teamDetails}>
                <Text style={[styles.teamName, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
                  {item.members ? item.members.length : 0} {t('teamManagement.members')}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.teamsList}
        />
      )}

      {/* Team Details Modal */}
      <Modal
        visible={isTeamDetailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTeamDetailsModalVisible(false)}
      >
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedTeam?.name}
              </Text>
              <TouchableOpacity onPress={() => setIsTeamDetailsModalVisible(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {renderTeamDetails()}
          </View>
        </View>
      </Modal>

      {/* Create Team Modal */}
      <Modal
        visible={isCreateTeamModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateTeamModalVisible(false)}
      >
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t('teamManagement.createNewTeam')}
              </Text>
              <TouchableOpacity onPress={() => setIsCreateTeamModalVisible(false)}>
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              placeholder={t('teamManagement.teamName')}
              placeholderTextColor={theme.placeholder}
              value={newTeamName}
              onChangeText={setNewTeamName}
            />

            <Text style={[styles.label, { color: theme.text }]}>
              {t('teamManagement.selectMembers')}
            </Text>

            {availableUsers.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {t('teamManagement.noAvailableUsers')}
              </Text>
            ) : (
              <FlatList
                data={availableUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = selectedUsers.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.userSelectItem,
                        { 
                          backgroundColor: isSelected ? theme.success + '20' : theme.inputBackground,
                          borderColor: theme.border 
                        }
                      ]}
                      onPress={() => handleUserSelect(item.id)}
                    >
                      <View style={styles.memberInfo}>
                        <Text style={[styles.memberName, { color: theme.text }]}>
                          {item.fullname}
                        </Text>
                        <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                          {item.email}
                        </Text>
                      </View>
                      <View style={[
                        styles.checkBox,
                        { 
                          borderColor: isSelected ? theme.success : theme.border,
                          backgroundColor: isSelected ? theme.success : 'transparent'
                        }
                      ]}>
                        {isSelected && <Icon name="check" size={16} color={theme.buttonText} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                style={styles.membersList}
              />
            )}

            <TouchableOpacity
              style={[
                styles.createTeamButton, 
                { 
                  backgroundColor: theme.primary,
                  opacity: loading.createTeam || !newTeamName.trim() ? 0.7 : 1 
                }
              ]}
              onPress={handleCreateTeam}
              disabled={loading.createTeam || !newTeamName.trim()}
            >
              {loading.createTeam ? (
                <ActivityIndicator size="small" color={theme.buttonText} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                  {t('teamManagement.createTeam')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  teamsList: {
    flexGrow: 1,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalTabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  teamInfoContainer: {
    padding: 10,
  },
  teamInfoLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  teamInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  membersList: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 13,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  userSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTeamButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManagerTeamManagement; 