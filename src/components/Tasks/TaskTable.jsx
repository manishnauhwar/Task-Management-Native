import { View, TouchableOpacity, RefreshControl, FlatList, StyleSheet } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Text, Button, Portal, Dialog, TextInput, Switch, Surface, List, Divider, Snackbar, Chip, IconButton, TouchableRipple, Menu } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../../utils/axiosinstance';
import { useTheme } from '../../utils/ThemeContext';
import { getCurrentUser } from '../../utils/authService';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

const getStatusColor = (status) => {
  if (!status) return '#9e9e9e';

  switch (String(status).toLowerCase()) {
    case 'completed': return '#4caf50';
    case 'in progress': return '#2196f3';
    case 'to do': return '#ff9800';
    case 'overdue': return '#f44336';
    default: return '#9e9e9e';
  }
};

const getPriorityColor = (priority) => {
  if (!priority) return '#9e9e9e';

  switch (String(priority).toLowerCase()) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#9e9e9e';
  }
};

const StatusChip = ({ status }) => (
  <Chip style={{ backgroundColor: getStatusColor(status) + '20', marginVertical: 2 }} textStyle={{ color: getStatusColor(status), fontSize: 12 }}>
    {status}
  </Chip>
);

const PriorityChip = ({ priority }) => (
  <Chip style={{ backgroundColor: getPriorityColor(priority) + '20', marginVertical: 2 }} textStyle={{ color: getPriorityColor(priority), fontSize: 12 }}>
    {priority}
  </Chip>
);

const TaskTable = ({
  sortField = '',
  sortOrder = 'asc',
  filterStatus = 'All',
  filterPriority = 'All',
  searchQuery = ''
}) => {
  const { theme} = useTheme();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
  });
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);

  useEffect(() => {
    loadUserAndFetchTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAddDialogVisible) {
        loadUserAndFetchTasks();
      }
    }, [isAddDialogVisible])
  );
  
  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, filterStatus, filterPriority, searchQuery, sortField, sortOrder]);

  const loadUserAndFetchTasks = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await fetchTasks(currentUser);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const fetchTasks = async (currentUser) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/tasks');
      if (response.data && Array.isArray(response.data)) {
        const processedTasks = response.data.map(task => {
          const taskDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (task.status !== 'Completed' && taskDate < today) {
            return { ...task, status: 'overdue' };
          }
          return task;
        });

        let userTasks = processedTasks;

        if (currentUser.role === 'admin') {
        } else if (currentUser.role === 'manager') {
          try {
            const teamsResponse = await axiosInstance.get('/teams');
            const managedTeams = teamsResponse.data.filter(
              team => team.manager && team.manager._id === currentUser.id
            );
            const teamMemberIds = [];
            managedTeams.forEach(team => {
              if (team.members && team.members.length > 0) {
                team.members.forEach(member => {
                  teamMemberIds.push(member._id);
                });
              }
            });
            setTeamMembers(teamMemberIds);
            userTasks = processedTasks.filter(task =>
              task.userId === currentUser.id ||
              teamMemberIds.includes(task.userId) ||
              task.assignedTo === currentUser.id ||
              teamMemberIds.includes(task.assignedTo)
            );
          } catch (error) {
            userTasks = processedTasks.filter(
              task => task.userId === currentUser.id || task.assignedTo === currentUser.id
            );
          }
        } else {
          userTasks = processedTasks.filter(
            task => task.userId === currentUser.id || task.assignedTo === currentUser.id
          );
        }

        setTasks(userTasks.reverse());
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(t('taskTable.errorFetch'));
      setSnackbarVisible(true);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDateForBackend = (dateString) => {
    if (!dateString) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [month, day, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
    }

    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const filterAndSortTasks = () => {
    const filtered = tasks.filter(task => {
      const searchMatch = !searchQuery ||
        (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const statusMatch = filterStatus === 'All' ||
        (filterStatus === 'overdue' && task.status === 'overdue') ||
        (filterStatus !== 'overdue' && task.status && task.status.toLowerCase() === filterStatus.toLowerCase());

      const priorityMatch = filterPriority === 'All' ||
        (task.priority && task.priority.toLowerCase() === filterPriority.toLowerCase());

      return searchMatch && statusMatch && priorityMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (!sortField) return 0;

      const valA = a[sortField] ? String(a[sortField]).toLowerCase() : '';
      const valB = b[sortField] ? String(b[sortField]).toLowerCase() : '';

      if (sortField === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        const orderA = priorityOrder[valA] || 999;
        const orderB = priorityOrder[valB] || 999;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      } else if (sortField === 'status') {
        const statusOrder = { 'completed': 1, 'in progress': 2, 'to do': 3, 'overdue': 4 };
        const orderA = statusOrder[valA] || 999;
        const orderB = statusOrder[valB] || 999;
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      }

      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    setFilteredTasks(sorted);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserAndFetchTasks();
  }, []);

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setIsDialogVisible(true);
  };

  const toggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
      const response = await axiosInstance.put(`/tasks/${task._id}`, { ...task, status: newStatus });
      if (response.data) {
        setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
        if (selectedTask && selectedTask._id === task._id) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
        setError(t('taskTable.statusUpdated', { status: newStatus }));
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(error.response?.data?.message || t('taskTable.failedStatusUpdate'));
      setSnackbarVisible(true);
    }
  };

  const updateTask = async () => {
    try {
      if (!selectedTask) return;
      const response = await axiosInstance.put(`/tasks/${selectedTask._id}`, {
        title: selectedTask.title,
        status: selectedTask.status,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate,
        description: selectedTask.description,
      });
      if (response.data) {
        setTasks(tasks.map(task => task._id === selectedTask._id ? response.data : task));
        setIsEditDialogVisible(false);
        setError(t('taskTable.taskUpdated'));
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.response?.data?.message || t('taskTable.failedUpdate'));
      setSnackbarVisible(true);
    }
  };

  const deleteTask = async () => {
    try {
      if (!selectedTask) return;
      await axiosInstance.delete(`/tasks/${selectedTask._id}`);
      setTasks(tasks.filter(task => task._id !== selectedTask._id));
      setIsDeleteDialogVisible(false);
      setError(t('taskTable.taskDeleted'));
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.response?.data?.message || t('taskTable.failedDelete'));
      setSnackbarVisible(true);
    }
  };

  const submitNewTask = async () => {
    if (!user) {
      setError(t('taskTable.pleaseLogin'));
      setSnackbarVisible(true);
      return;
    }

    if (!newTask.title.trim()) {
      setError(t('taskTable.pleaseEnterTitle'));
      setSnackbarVisible(true);
      return;
    }

    try {
      setLoading(true);
      const taskToSubmit = {
        title: newTask.title,
        description: newTask.description || '',
        dueDate: formatDateForBackend(newTask.dueDate),
        priority: newTask.priority || 'Medium',
        status: 'To Do',
        assignedTo: user.id,
        userId: user.id,
      };

      const response = await axiosInstance.post('/tasks/post', taskToSubmit);

      if (response.data) {
        setTasks([response.data, ...tasks]);
        setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium' });
        setIsAddDialogVisible(false);
        setError(t('taskTable.taskAdded'));
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setError(error.response?.data?.message || t('taskTable.failedAdd'));
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const canEditTask = (task) => {
    if (!user) return false;
    return task.userId === user.id ||
      task.assignedTo === user.id ||
      ['admin', 'manager'].includes(user.role);
  };

  const canDeleteTask = (task) => {
    if (!user) return false;
    return ['admin', 'manager'].includes(user.role);
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleDueDateChange = (text) => {
    if (text.length === 2 && !text.includes('/')) {
      text = `${text}/`;
    } else if (text.length === 5 && text.charAt(2) === '/' && !text.includes('/', 3)) {
      text = `${text}/`;
    }
    setNewTask({ ...newTask, dueDate: text });
  };

  const renderItem = ({ item }) => (
    <TouchableRipple onPress={() => handleTaskPress(item)}>
      <View style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flex: 3 }}>
          <Text numberOfLines={2} style={{ fontWeight: '500', color: theme.text }}>{item.title}</Text>
        </View>
        <View style={{ flex: 2, alignItems: 'center' }}>
          <StatusChip status={item.status} />
        </View>
        <View style={{ flex: 2, alignItems: 'center' }}>
          <PriorityChip priority={item.priority} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <IconButton
            icon={item.status === 'Completed' ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            iconColor={item.status === 'Completed' ? theme.success : '#9e9e9e'}
            size={24}
            onPress={(e) => {
              e.stopPropagation();
              toggleTaskStatus(item);
            }}
          />
        </View>
      </View>
    </TouchableRipple>
  );

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.background }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}
        onPress={() => setIsAddDialogVisible(true)}
      >
        <Icon name="plus-circle" size={24} color={theme.primary} />
        <Text style={{ marginLeft: 8, color: theme.primary, fontWeight: '500' }}>{t('taskTable.addNewTask')}</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', backgroundColor: theme.surface, padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ flex: 3 }}>
          <Text style={{ fontWeight: 'bold', color: theme.text }}>{t('taskTable.header.title')}</Text>
        </View>
        <View style={{ flex: 3, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', color: theme.text }}>{t('taskTable.header.status')}</Text>
        </View>
        <View style={{ flex: 2, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', color: theme.text }}>{t('taskTable.header.priority')}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', color: theme.text }}>{t('taskTable.header.done')}</Text>
        </View>
      </View>

      {loading && filteredTasks.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: theme.text }}>{t('taskTable.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || String(Math.random())}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: theme.text }}>{t('taskTable.noTasks')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
          contentContainerStyle={filteredTasks.length === 0 ? { flex: 1 } : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)} style={{ borderRadius: 8 }}>
          <Dialog.Title style={{ textAlign: 'center' }}>{t('taskTable.dialog.detailsTitle')}</Dialog.Title>
          <Dialog.Content>
            <Surface style={{ borderRadius: 8, padding: 8 }}>
              <List.Section>
                <List.Item
                  title={t('taskTable.dialog.title')}
                  description={selectedTask?.title}
                  left={props => <List.Icon {...props} icon="format-title" />}
                />
                <Divider />
                <List.Item
                  title={t('taskTable.dialog.description')}
                  description={selectedTask?.description || t('taskTable.dialog.noDescription')}
                  left={props => <List.Icon {...props} icon="text-box-outline" />}
                />
                <Divider />
                <List.Item
                  title={t('taskTable.dialog.status')}
                  description={() => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text>{selectedTask?.status}</Text>
                      {selectedTask && canEditTask(selectedTask) && (
                        <Switch
                          value={selectedTask?.status === 'Completed'}
                          onValueChange={() => {
                            toggleTaskStatus(selectedTask);
                            setIsDialogVisible(false);
                          }}
                          color={getStatusColor('Completed')}
                        />
                      )}
                    </View>
                  )}
                  left={props => <List.Icon {...props} icon="checkbox-marked-circle-outline" />}
                />
                <Divider />
                <List.Item
                  title={t('taskTable.dialog.priority')}
                  description={selectedTask?.priority}
                  left={props => <List.Icon {...props} icon="priority-high" />}
                />
                <Divider />
                <List.Item
                  title={t('taskTable.dialog.dueDate')}
                  description={selectedTask?.dueDate ? formatDateForDisplay(selectedTask.dueDate) : t('taskTable.dialog.noDueDate')}
                  left={props => <List.Icon {...props} icon="calendar" />}
                />
              </List.Section>
            </Surface>
          </Dialog.Content>
          <Dialog.Actions>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 8 }}>
              {selectedTask && canDeleteTask(selectedTask) && (
                <Button mode="contained" buttonColor={theme.error} onPress={() => { setIsDialogVisible(false); setIsDeleteDialogVisible(true); }}>
                  {t('taskTable.dialog.delete')}
                </Button>
              )}
              {selectedTask && canEditTask(selectedTask) && (
                <Button mode="contained" buttonColor={theme.primary} onPress={() => { setIsDialogVisible(false); setIsEditDialogVisible(true); }}>
                  {t('taskTable.dialog.edit')}
                </Button>
              )}
              <Button mode="outlined" onPress={() => setIsDialogVisible(false)}>
                {t('taskTable.dialog.close')}
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog visible={isEditDialogVisible} onDismiss={() => setIsEditDialogVisible(false)} style={{ borderRadius: 8 }}>
          <Dialog.Title style={{ textAlign: 'center' }}>{t('taskTable.dialog.editTitle')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('taskTable.input.title')}
              value={selectedTask?.title}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, title: text })}
              style={{ marginBottom: 8 }}
              mode="outlined"
            />
            <TextInput
              label={t('taskTable.input.description')}
              value={selectedTask?.description}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, description: text })}
              style={{ marginBottom: 8 }}
              mode="outlined"
              multiline
            />
            <Menu
              visible={priorityMenuVisible}
              onDismiss={() => setPriorityMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setPriorityMenuVisible(true)} style={{ marginVertical: 8 }}>
                  {t('taskTable.input.priority')}: {selectedTask?.priority || t('taskTable.input.select')}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setSelectedTask({ ...selectedTask, priority: 'Low' });
                  setPriorityMenuVisible(false);
                }}
                title="Low"
              />
              <Menu.Item
                onPress={() => {
                  setSelectedTask({ ...selectedTask, priority: 'Medium' });
                  setPriorityMenuVisible(false);
                }}
                title="Medium"
              />
              <Menu.Item
                onPress={() => {
                  setSelectedTask({ ...selectedTask, priority: 'High' });
                  setPriorityMenuVisible(false);
                }}
                title="High"
              />
            </Menu>
            <TextInput
              label={t('taskTable.input.dueDate')}
              value={selectedTask?.dueDate ? formatDateForDisplay(selectedTask.dueDate) : ''}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, dueDate: text })}
              style={{ marginBottom: 8 }}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsEditDialogVisible(false)}>{t('taskTable.dialog.cancel')}</Button>
            <Button mode="contained" buttonColor={theme.primary} onPress={updateTask}>{t('taskTable.dialog.save')}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isDeleteDialogVisible} onDismiss={() => setIsDeleteDialogVisible(false)} style={{ borderRadius: 8 }}>
          <Dialog.Title style={{ textAlign: 'center' }}>{t('taskTable.dialog.deleteTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('taskTable.dialog.deleteMessage', { title: selectedTask?.title })}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDeleteDialogVisible(false)}>{t('taskTable.dialog.cancel')}</Button>
            <Button mode="contained" buttonColor={theme.error} onPress={deleteTask}>{t('taskTable.dialog.delete')}</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isAddDialogVisible} onDismiss={() => setIsAddDialogVisible(false)} style={{ borderRadius: 8 }}>
          <Dialog.Title style={{ textAlign: 'center' }}>{t('taskTable.dialog.addTitle')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t('taskTable.input.title')}
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              style={{ marginBottom: 8 }}
              mode="outlined"
              autoCapitalize="sentences"
            />
            <TextInput
              label={t('taskTable.input.description')}
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              style={{ marginBottom: 8 }}
              mode="outlined"
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
            <Menu
              visible={priorityMenuVisible}
              onDismiss={() => setPriorityMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setPriorityMenuVisible(true)} style={{ marginVertical: 8 }}>
                  {t('taskTable.input.priority')}: {newTask.priority}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setNewTask({ ...newTask, priority: 'Low' });
                  setPriorityMenuVisible(false);
                }}
                title="Low"
              />
              <Menu.Item
                onPress={() => {
                  setNewTask({ ...newTask, priority: 'Medium' });
                  setPriorityMenuVisible(false);
                }}
                title="Medium"
              />
              <Menu.Item
                onPress={() => {
                  setNewTask({ ...newTask, priority: 'High' });
                  setPriorityMenuVisible(false);
                }}
                title="High"
              />
            </Menu>
            <TextInput
              label={t('taskTable.input.dueDate')}
              value={newTask.dueDate}
              onChangeText={handleDueDateChange}
              style={{ marginBottom: 8 }}
              mode="outlined"
              keyboardType="numeric"
              maxLength={10}
              placeholder="MM/DD/YYYY"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsAddDialogVisible(false)}>{t('taskTable.dialog.cancel')}</Button>
            <Button mode="contained" buttonColor={theme.primary} onPress={submitNewTask}>{t('taskTable.dialog.addTask')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: t('taskTable.dialog.dismiss'),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </Surface>
  );
};

export default TaskTable;