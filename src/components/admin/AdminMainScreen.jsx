import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../../utils/axiosinstance';
import { getCurrentUser } from '../../utils/authService';
import { useTheme } from '../../utils/ThemeContext';
import { useNotification } from '../../utils/NotificationContext';
import TeamCard from './TeamCard';
import TeamFormModal from './TeamFormModal';
import { useTranslation } from 'react-i18next';

const AdminMainScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (user?.role !== 'admin') {
          addNotification({
            title: t('admin.accessDeniedTitle'),
            message: t('admin.accessDeniedMsg'),
          });
          navigation.replace('Tasks');
        }
      } catch (error) {
        addNotification({
          title: t('admin.authErrorTitle'),
          message: t('admin.authErrorMsg'),
        });
      }
    })();
  }, [addNotification, navigation, t]);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/teams');
      setTeams(response.data);
    } catch (error) {
      addNotification({
        title: t('admin.dataErrorTitle'),
        message: t('admin.loadTeamsError'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, t]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/users/alluser');
      const users = response.data.allUsers;
      const managers = users.filter((user) => user.role === 'manager');
      const members = users.filter((user) => user.role === 'user');
      setAvailableManagers(managers);
      setAvailableMembers(members);
    } catch (error) {
      addNotification({
        title: t('admin.dataErrorTitle'),
        message: t('admin.loadUsersError'),
      });
    }
  }, [addNotification, t]);

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingTeamId(null);
    setTeamName('');
    setSelectedManager(null);
    setSelectedMembers([]);
    setModalVisible(true);
  };

  const handleEditTeam = (team) => {
    setIsEditMode(true);
    setEditingTeamId(team._id || team.id);
    setTeamName(team.name);

    const manager = availableManagers.find(
      (m) => (m._id || m.id) === (team.manager?._id || team.manager?.id)
    ) || null;
    setSelectedManager(manager);

    const members = availableMembers.filter((m) =>
      team.members?.some((tm) => (tm._id || tm.id) === (m._id || m.id))
    );
    setSelectedMembers(members);

    setModalVisible(true);
  };

  const handleDeleteTeam = (team) => {
    Alert.alert(
      t('admin.deleteTeamTitle'),
      t('admin.deleteTeamConfirm', { teamName: team.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteTeam(team),
        },
      ]
    );
  };

  const deleteTeam = async (team) => {
    try {
      await axiosInstance.delete(`/teams/${team._id || team.id}`);
      addNotification({
        title: t('admin.successTitle'),
        message: t('admin.deleteTeamSuccess', { teamName: team.name }),
      });
      fetchTeams();
    } catch (error) {
      console.error('Delete team error:', error);
      addNotification({
        title: t('admin.errorTitle'),
        message: t('admin.deleteTeamFail'),
      });
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      addNotification({
        title: t('admin.validationErrorTitle'),
        message: t('admin.teamNameRequired'),
      });
      return;
    }
    if (!selectedManager) {
      addNotification({
        title: t('admin.validationErrorTitle'),
        message: t('admin.managerRequired'),
      });
      return;
    }
    setIsSubmitting(true);

    const teamData = {
      name: teamName.trim(),
      managerId: selectedManager._id || selectedManager.id,
      memberIds: selectedMembers.map((member) => member._id || member.id),
    };

    try {
      if (isEditMode) {
        await axiosInstance.put(`/teams/${editingTeamId}`, teamData);
        addNotification({ title: t('admin.successTitle'), message: t('admin.teamUpdateSuccess') });
      } else {
        await axiosInstance.post('/teams/post', teamData);
        addNotification({ title: t('admin.successTitle'), message: t('admin.teamCreateSuccess') });
      }
      fetchTeams();
      closeModal();
    } catch (error) {
      console.error('Team save error:', error);
      addNotification({
        title: t('admin.errorTitle'),
        message: t('admin.saveTeamFail'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTeamName('');
    setSelectedManager(null);
    setSelectedMembers([]);
    setIsEditMode(false);
    setEditingTeamId(null);
  };

  const toggleMemberSelection = (member) => {
    if (selectedMembers.some((m) => (m._id || m.id) === (member._id || member.id))) {
      setSelectedMembers(selectedMembers.filter((m) => (m._id || m.id) !== (member._id || member.id)));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? 'light-content' : 'dark-content'}
      />
      <View style={styles.adminHeader}>
        <Text style={styles.adminHeaderTitle}>{t('admin.adminDashboard')}</Text>
      </View>
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          icon="clipboard-text"
          onPress={() => navigation.navigate('Tasks')}
          style={styles.navButton}
        >
          {t('admin.viewTasks')}
        </Button>
        <Button
          mode="contained"
          icon="plus"
          onPress={openCreateModal}
          style={styles.navButton}
        >
          {t('admin.addTeam')}
        </Button>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Text style={styles.loadingText}>{t('admin.loadingTeams')}</Text>
        ) : teams.length === 0 ? (
          <Text style={styles.emptyText}>{t('admin.noTeams')}</Text>
        ) : (
          teams.map((team) => (
            <TeamCard
              key={team._id || team.id}
              team={team}
              onEditTeam={handleEditTeam}
              onDeleteTeam={handleDeleteTeam}
            />
          ))
        )}
      </ScrollView>

      <TeamFormModal
        visible={modalVisible}
        onClose={closeModal}
        isEditMode={isEditMode}
        teamName={teamName}
        setTeamName={setTeamName}
        availableManagers={availableManagers}
        selectedManager={selectedManager}
        setSelectedManager={setSelectedManager}
        availableMembers={availableMembers}
        selectedMembers={selectedMembers}
        toggleMemberSelection={toggleMemberSelection}
        onSave={handleSaveTeam}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  adminHeader: {
    backgroundColor: '#3f51b5',
    padding: 10,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  container: {
    padding: 8,
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default AdminMainScreen;
