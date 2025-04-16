import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet,StatusBar,ScrollView,TouchableOpacity,  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Avatar,
  Chip,
  Button,
  Menu,
  Surface,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';
import axiosInstance from '../utils/axiosinstance';
import { getCurrentUser } from '../utils/authService';

const Stack = createStackNavigator();

const TeamCard = ({ team, onEditTeam, onDeleteTeam }) => {
  const paperTheme = usePaperTheme();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (id) => {
    const colors = [
      '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9',
      '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9',
      '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2',
    ];
    const hash = String(id)
      .split('')
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & a, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const managerId = team.manager?._id || team.manager?.id || 'unknown';
  const managerName = team.manager?.fullname || team.manager?.name || 'Unknown Manager';
  const managerInitials = getInitials(managerName);
  const avatarColor = getAvatarColor(managerId);

  return (
    <Card style={styles.teamCard} elevation={4}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <View style={styles.teamTitleSection}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Chip mode="outlined" style={styles.memberChip}>
              {team.members?.length || 0} members
            </Chip>
          </View>
          <View style={styles.teamActions}>
            <TouchableOpacity onPress={() => onEditTeam(team)} style={styles.actionIcon}>
              <Icon name="pencil" size={20} color={paperTheme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteTeam(team)} style={styles.actionIcon}>
              <Icon name="delete" size={20} color={paperTheme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.managerSection}>
          <Text style={styles.sectionHeading}>Manager</Text>
          <View style={styles.managerInfo}>
            <Avatar.Text
              size={48}
              label={managerInitials}
              style={[styles.managerAvatar, { backgroundColor: avatarColor }]}
              labelStyle={styles.managerAvatarLabel}
            />
            <View style={styles.managerDetails}>
              <Text style={styles.managerName}>{managerName}</Text>
              <Text style={styles.managerEmail}>
                {team.manager?.email || 'No email provided'}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const TaskCard = ({ task, teams, onAssignTask }) => {
  const paperTheme = usePaperTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <Surface style={styles.taskSurface} elevation={3}>
      <Card style={styles.taskCard} mode="outlined">
        <Card.Content>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description || 'No description provided'}
          </Text>
          <View style={styles.taskFooter}>
            <Icon name="calendar-clock" size={18} color={paperTheme.colors.accent} />
            <Text style={styles.taskDueDate}>
              {formatDueDate(task.dueDate)}
            </Text>
          </View>
          <View style={styles.dropdownContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <Button mode="contained" onPress={openMenu} style={styles.dropdownButton}>
                  Assign to Team
                </Button>
              }
            >
              {teams.map((team) => (
                <Menu.Item
                  key={team._id || team.id}
                  title={team.name}
                  onPress={() => {
                    onAssignTask(task, team);
                    closeMenu();
                  }}
                />
              ))}
            </Menu>
          </View>
        </Card.Content>
      </Card>
    </Surface>
  );
};

const AdminMainScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { addNotification } = useNotification();

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
            title: 'Access Denied',
            message: 'You do not have admin privileges.',
          });
          navigation.replace('Tasks');
        }
      } catch (error) {
        addNotification({
          title: 'Authentication Error',
          message: 'Failed to verify user credentials.',
        });
      }
    })();
  }, [addNotification, navigation]);

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
        title: 'Data Error',
        message: 'Failed to load teams.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

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
        title: 'Data Error',
        message: 'Failed to load users.',
      });
    }
  }, [addNotification]);

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
    Alert.alert('Delete Team', `Are you sure you want to delete "${team.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTeam(team),
      },
    ]);
  };

  const deleteTeam = async (team) => {
    try {
      console.log('Deleting team:', team);
      await axiosInstance.delete(`/teams/${team._id || team.id}`);
      addNotification({
        title: 'Success',
        message: `Team "${team.name}" deleted successfully.`,
      });
      fetchTeams();
    } catch (error) {
      console.error('Delete team error:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to delete team.',
      });
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      addNotification({
        title: 'Validation Error',
        message: 'Team name is required.',
      });
      return;
    }
    if (!selectedManager) {
      addNotification({
        title: 'Validation Error',
        message: 'Please select a manager.',
      });
      return;
    }
    setIsSubmitting(true);

    const teamData = {
      name: teamName.trim(),
      managerId: selectedManager._id || selectedManager.id,
      memberIds: selectedMembers.map((member) => member._id || member.id),
    };

    console.log('Saving team payload:', teamData);

    try {
      if (isEditMode) {
        await axiosInstance.put(`/teams/${editingTeamId}`, teamData);
        addNotification({ title: 'Success', message: 'Team updated successfully.' });
      } else {
        await axiosInstance.post('/teams/post', teamData);
        addNotification({ title: 'Success', message: 'Team created successfully.' });
      }
      fetchTeams();
      closeModal();
    } catch (error) {
      console.error('Team save error:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to save team. Please check the logs for details.',
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

  const isMemberSelected = (member) => {
    return selectedMembers.some((m) => (m._id || m.id) === (member._id || member.id));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? 'light-content' : 'dark-content'}
      />
      <View style={styles.adminHeader}>
        <Text style={styles.adminHeaderTitle}>Admin Dashboard</Text>
      </View>
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          icon="clipboard-text"
          onPress={() => navigation.navigate('Tasks')}
          style={styles.navButton}
        >
          View Tasks
        </Button>
        <Button
          mode="contained"
          icon="plus"
          onPress={openCreateModal}
          style={styles.navButton}
        >
          Add Team
        </Button>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text>Loading teams...</Text>
            </Card.Content>
          </Card>
        ) : teams.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>No teams available</Text>
            </Card.Content>
          </Card>
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
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Title title={isEditMode ? 'Edit Team' : 'Create Team'} />
            <Card.Content>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="Team Name"
                placeholderTextColor="#9e9e9e"
              />
              <Text style={styles.modalLabel}>Select Manager</Text>
              <ScrollView style={styles.userList}>
                {availableManagers.length === 0 ? (
                  <Text>No managers available</Text>
                ) : (
                  availableManagers.map((manager) => (
                    <TouchableOpacity
                      key={manager._id || manager.id}
                      onPress={() => setSelectedManager(manager)}
                      style={[
                        styles.userItem,
                        selectedManager &&
                          (selectedManager._id || selectedManager.id) === (manager._id || manager.id) &&
                          styles.selectedUser,
                      ]}
                    >
                      <Text>{manager.fullname || manager.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <Text style={styles.modalLabel}>Select Members</Text>
              <ScrollView style={styles.userList}>
                {availableMembers.length === 0 ? (
                  <Text>No members available</Text>
                ) : (
                  availableMembers.map((member) => (
                    <TouchableOpacity
                      key={member._id || member.id}
                      onPress={() => toggleMemberSelection(member)}
                      style={[
                        styles.userItem,
                        isMemberSelected(member) && styles.selectedUser,
                      ]}
                    >
                      <Text>{member.fullname || member.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button mode="outlined" onPress={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSaveTeam} loading={isSubmitting} disabled={isSubmitting}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const TasksScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const taskResponse = await axiosInstance.get('/tasks');
      const currentUser = await getCurrentUser();
      const userId = currentUser.id || currentUser._id;
      const filteredTasks = taskResponse.data.filter(
        (task) => !task.assignedTo || task.assignedTo === userId
      );
      setTasks(filteredTasks);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load tasks.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const fetchTeams = useCallback(async () => {
    try {
      const teamResponse = await axiosInstance.get('/teams');
      setTeams(teamResponse.data);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load teams for assignment.',
      });
    }
  }, [addNotification]);

  const handleAssignTask = async (task, team) => {
    try {
      // Get the team manager's id
      const managerId = team.manager?._id || team.manager?.id;
      if (!managerId) {
        addNotification({
          title: 'Assignment Error',
          message: 'Selected team does not have a valid manager.',
        });
        return;
      }
  
      const updatedTask = { ...task, assignedTo: managerId };
      await axiosInstance.put(`/tasks/${task._id || task.id}`, updatedTask);
  
      const adminUser = await getCurrentUser();
  
      await axiosInstance.post('/notifications', {
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `Admin has assigned you a new task: "${task.title}""`,
        recipient: managerId,
        sender: adminUser._id || adminUser.id,
      });
      addNotification({
        title: 'Success',
        message: `Task assigned to ${team.name} manager.`,
      });
  
      setTasks(tasks.filter(t => (t._id || t.id) !== (task._id || task.id)));
    } catch (error) {
      console.error('Error assigning task:', error);
      addNotification({
        title: 'Assignment Failed',
        message: error.response?.data?.message || 'There was a problem assigning the task.',
      });
    }
  };
  

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.taskHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.tasksHeading}>My Tasks</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Card style={styles.loadingCard}>
            <Card.Content>
              <Text>Loading tasks...</Text>
            </Card.Content>
          </Card>
        ) : tasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>No tasks available</Text>
            </Card.Content>
          </Card>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task._id || task.id} task={task} teams={teams} onAssignTask={handleAssignTask} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const AdminScreen = () => {
  return (
    <Stack.Navigator initialRouteName="AdminMain" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminMainScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
    </Stack.Navigator>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  adminHeader: {
    // backgroundColor: '#6200EE',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  adminHeaderTitle: {
    // color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskHeader: {
    marginTop:20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'skyblue',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius:18,
    marginHorizontal:15
  },
  backButton: {
    marginRight: 16,
  },
  tasksHeading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  teamCard: {
    marginVertical: 8,
    borderRadius: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamTitleSection: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  memberChip: {
    marginTop: 4,
    backgroundColor: '#F1F1F1',
  },
  teamActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 12,
  },
  managerSection: {
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerAvatar: {
    marginRight: 12,
  },
  managerAvatarLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  managerDetails: {},
  managerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  managerEmail: {
    fontSize: 14,
    color: '#777',
  },
  loadingCard: {
    marginVertical: 8,
  },
  emptyCard: {
    marginVertical: 8,
  },
  taskSurface: {
    borderRadius: 10,
    marginVertical: 8,
    overflow: 'hidden',
  },
  taskCard: {
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  taskDueDate: {
    fontSize: 16,
    color: '#6200EE',
    marginLeft: 6,
  },
  dropdownContainer: {
    marginTop: 12,
  },
  dropdownButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#6200EE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    padding: 16,
    borderRadius: 12,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    paddingVertical: 6,
    color: '#000',
    fontSize: 16,
  },
  modalLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  userList: {
    maxHeight: 120,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 6,
    borderRadius: 8,
  },
  userItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  selectedUser: {
    backgroundColor: '#E0E0E0',
  },
  modalActions: {
    justifyContent: 'flex-end',
  },
});
