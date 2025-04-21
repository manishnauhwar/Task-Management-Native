import { View, TouchableOpacity, RefreshControl, FlatList, StyleSheet, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { Text, Button, Portal, Dialog, TextInput as PaperTextInput, Switch, Surface, List, Divider, Snackbar, Chip, IconButton, TouchableRipple, Menu } from 'react-native-paper';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (isTogglingStatus) return;
    try {
      setIsTogglingStatus(true);
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
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const updateTask = async () => {
    if (isEditing) return;
    try {
      setIsEditing(true);
      if (!selectedTask) return;
      const response = await axiosInstance.put(`/tasks/${selectedTask._id}`, {
        title: selectedTask.title,
        status: selectedTask.status,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate,
        description: selectedTask.description,
      });
      if (response.data) {
        await loadUserAndFetchTasks();
        setIsEditDialogVisible(false);
        setError(t('taskTable.taskUpdated'));
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.response?.data?.message || t('taskTable.failedUpdate'));
      setSnackbarVisible(true);
    } finally {
      setIsEditing(false);
    }
  };

  const deleteTask = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      if (!selectedTask) return;
      await axiosInstance.delete(`/tasks/${selectedTask._id}`);
      await loadUserAndFetchTasks();
      setIsDeleteDialogVisible(false);
      setIsDialogVisible(false);
      setError(t('taskTable.taskDeleted'));
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error.response?.data?.message || t('taskTable.failedDelete'));
      setSnackbarVisible(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const submitNewTask = async () => {
    if (isSubmitting) return;
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
      setIsSubmitting(true);
      const taskToSubmit = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || '',
        dueDate: formatDateForBackend(newTask.dueDate),
        priority: newTask.priority || 'Medium',
        status: 'To Do',
        assignedTo: user.id,
        userId: user.id,
      };

      await axiosInstance.post('/tasks/post', taskToSubmit);
      await loadUserAndFetchTasks();
      setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium' });
      setIsAddDialogVisible(false);
      setError(t('taskTable.taskAdded'));
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Error adding task:', error);
      setError(error.response?.data?.message || t('taskTable.failedAdd'));
      setSnackbarVisible(true);
    } finally {
      setIsSubmitting(false);
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
    return ['admin', 'manager'].includes(user.role) || task.userId === user.id;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleDueDateChange = (text) => {
    let formattedText = text;
    if (text.length === 2 && !text.includes('/')) {
      formattedText = `${text}/`;
    } else if (text.length === 5 && text.charAt(2) === '/' && !text.includes('/', 3)) {
      formattedText = `${text}/`;
    }
    setSelectedTask(prev => ({ ...prev, dueDate: formattedText }));
  };

  const handleNewTaskDueDateChange = (text) => {
    let formattedText = text;
    if (text.length === 2 && !text.includes('/')) {
      formattedText = `${text}/`;
    } else if (text.length === 5 && text.charAt(2) === '/' && !text.includes('/', 3)) {
      formattedText = `${text}/`;
    }
    setNewTask(prev => ({ ...prev, dueDate: formattedText }));
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
          <View style={[styles.priorityBox, { backgroundColor: getPriorityColor(item.priority) + '20', borderColor: getPriorityColor(item.priority) }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <IconButton
            icon={item.status?.toLowerCase() === 'completed' ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            iconColor={item.status?.toLowerCase() === 'completed' ? theme.success : '#9e9e9e'}
            size={24}
            disabled={isTogglingStatus}
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
        <Modal
          visible={isDialogVisible}
          onRequestClose={() => setIsDialogVisible(false)}
          transparent={true}
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContainer,
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              }
            ]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('taskTable.dialog.detailsTitle')}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsDialogVisible(false)}
                  style={[styles.closeButton, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}
                >
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>
                    {t('taskTable.dialog.title')}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedTask?.title}
                  </Text>
                </View>

                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>
                    {t('taskTable.dialog.description')}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedTask?.description || t('taskTable.dialog.noDescription')}
                  </Text>
                </View>

                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>
                    {t('taskTable.dialog.status')}
                  </Text>
                  <View style={styles.statusContainer}>
                    <StatusChip status={selectedTask?.status} />
                    {selectedTask && canEditTask(selectedTask) && (
                      <Switch
                        value={selectedTask?.status === 'Completed'}
                        onValueChange={() => {
                          toggleTaskStatus(selectedTask);
                          setIsDialogVisible(false);
                        }}
                        trackColor={{ false: theme.border, true: getStatusColor('Completed') }}
                        thumbColor={theme.buttonText}
                      />
                    )}
                  </View>
                </View>

                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>
                    {t('taskTable.dialog.priority')}
                  </Text>
                  <PriorityChip priority={selectedTask?.priority} />
                </View>

                <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.text }]}>
                    {t('taskTable.dialog.dueDate')}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedTask?.dueDate ? formatDateForDisplay(selectedTask.dueDate) : t('taskTable.dialog.noDueDate')}
                  </Text>
                </View>
              </View>

              <View style={[styles.buttonContainer, { borderTopColor: theme.border }]}>
                {selectedTask && canDeleteTask(selectedTask) && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { 
                        backgroundColor: theme.danger,
                        opacity: isDeleting ? 0.7 : 1
                      }
                    ]}
                    onPress={() => { 
                      setIsDialogVisible(false); 
                      setIsDeleteDialogVisible(true); 
                    }}
                  >
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                      {t('taskTable.dialog.delete')}
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedTask && canEditTask(selectedTask) && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      { 
                        backgroundColor: theme.primary,
                        opacity: isEditing ? 0.7 : 1
                      }
                    ]}
                    onPress={() => { 
                      setIsDialogVisible(false); 
                      setIsEditDialogVisible(true); 
                    }}
                  >
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                      {t('taskTable.dialog.edit')}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { 
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setIsDialogVisible(false)}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    {t('taskTable.dialog.close')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isEditDialogVisible}
          onRequestClose={() => !isEditing && setIsEditDialogVisible(false)}
          transparent={true}
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContainer, 
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              }
            ]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('taskTable.dialog.editTitle')}
                </Text>
                <TouchableOpacity 
                  onPress={() => !isEditing && setIsEditDialogVisible(false)}
                  disabled={isEditing}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.title')}
                </Text>
                <TextInput
                  value={selectedTask?.title || ''}
                  onChangeText={text => setSelectedTask(prev => ({...prev, title: text}))}
                  style={[
                    styles.textInput, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={t('taskTable.input.title')}
                  placeholderTextColor={theme.placeholder}
                  editable={!isEditing}
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.description')}
                </Text>
                <TextInput
                  value={selectedTask?.description || ''}
                  onChangeText={text => setSelectedTask(prev => ({...prev, description: text}))}
                  style={[
                    styles.textInput, 
                    styles.textArea, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={t('taskTable.input.description')}
                  placeholderTextColor={theme.placeholder}
                  multiline
                  numberOfLines={4}
                  editable={!isEditing}
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.priority')}
                </Text>
                <View style={styles.priorityButtons}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        { 
                          backgroundColor: selectedTask?.priority === p ? theme.primary : theme.inputBackground,
                          borderColor: theme.border,
                          opacity: isEditing ? 0.7 : 1
                        }
                      ]}
                      onPress={() => !isEditing && setSelectedTask(prev => ({...prev, priority: p}))}
                      disabled={isEditing}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        { color: selectedTask?.priority === p ? theme.buttonText : theme.text }
                      ]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.dueDate')}
                </Text>
                <TextInput
                  value={selectedTask?.dueDate ? formatDateForDisplay(selectedTask.dueDate) : ''}
                  onChangeText={text => setSelectedTask(prev => ({...prev, dueDate: text}))}
                  style={[
                    styles.textInput, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!isEditing}
                />
              </ScrollView>

              <View style={[styles.buttonContainer, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.cancelButton, 
                    { 
                      borderColor: theme.border,
                      opacity: isEditing ? 0.7 : 1
                    }
                  ]}
                  onPress={() => setIsEditDialogVisible(false)}
                  disabled={isEditing}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    {t('taskTable.dialog.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.saveButton, 
                    { 
                      backgroundColor: theme.primary,
                      borderColor: theme.border,
                      borderWidth: 1,
                      opacity: isEditing ? 0.7 : 1
                    }
                  ]}
                  onPress={updateTask}
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <ActivityIndicator color={theme.buttonText} size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                      {t('taskTable.dialog.save')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isDeleteDialogVisible}
          onRequestClose={() => !isDeleting && setIsDeleteDialogVisible(false)}
          transparent={true}
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContainer,
              styles.deleteModal,
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              }
            ]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('taskTable.dialog.deleteTitle')}
                </Text>
                <TouchableOpacity 
                  onPress={() => !isDeleting && setIsDeleteDialogVisible(false)}
                  disabled={isDeleting}
                  style={[styles.closeButton, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}
                >
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.deleteMessage, { color: theme.text }]}>
                  {t('taskTable.dialog.deleteMessage', { title: selectedTask?.title })}
                </Text>
              </View>

              <View style={[styles.buttonContainer, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { 
                      borderColor: theme.border,
                      opacity: isDeleting ? 0.7 : 1
                    }
                  ]}
                  onPress={() => setIsDeleteDialogVisible(false)}
                  disabled={isDeleting}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    {t('taskTable.dialog.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { 
                      backgroundColor: theme.danger,
                      borderColor: theme.danger,
                      opacity: isDeleting ? 0.7 : 1
                    }
                  ]}
                  onPress={deleteTask}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={theme.buttonText} size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                      {t('taskTable.dialog.delete')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isAddDialogVisible}
          onRequestClose={() => !isSubmitting && setIsAddDialogVisible(false)}
          transparent={true}
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContainer, 
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              }
            ]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('taskTable.dialog.addTitle')}
                </Text>
                <TouchableOpacity 
                  onPress={() => !isSubmitting && setIsAddDialogVisible(false)}
                  disabled={isSubmitting}
                  style={[styles.closeButton, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}
                >
                  <Icon name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.title')}
                </Text>
                <TextInput
                  value={newTask.title}
                  onChangeText={text => setNewTask(prev => ({...prev, title: text}))}
                  style={[
                    styles.textInput, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={t('taskTable.input.title')}
                  placeholderTextColor={theme.placeholder}
                  editable={!isSubmitting}
                  autoCapitalize="sentences"
                  maxLength={100}
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.description')}
                </Text>
                <TextInput
                  value={newTask.description}
                  onChangeText={text => setNewTask(prev => ({...prev, description: text}))}
                  style={[
                    styles.textInput, 
                    styles.textArea, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder={t('taskTable.input.description')}
                  placeholderTextColor={theme.placeholder}
                  multiline
                  numberOfLines={4}
                  editable={!isSubmitting}
                  autoCapitalize="sentences"
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.priority')}
                </Text>
                <View style={styles.priorityButtons}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        { 
                          backgroundColor: newTask.priority === p ? theme.primary : theme.inputBackground,
                          borderColor: theme.border,
                          opacity: isSubmitting ? 0.7 : 1
                        }
                      ]}
                      onPress={() => !isSubmitting && setNewTask(prev => ({...prev, priority: p}))}
                      disabled={isSubmitting}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        { color: newTask.priority === p ? theme.buttonText : theme.text }
                      ]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskTable.input.dueDate')}
                </Text>
                <TextInput
                  value={newTask.dueDate}
                  onChangeText={handleNewTaskDueDateChange}
                  style={[
                    styles.textInput, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    }
                  ]}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!isSubmitting}
                />
              </View>

              <View style={[styles.buttonContainer, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.cancelButton, 
                    { 
                      borderColor: theme.border,
                      opacity: isSubmitting ? 0.7 : 1
                    }
                  ]}
                  onPress={() => setIsAddDialogVisible(false)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    {t('taskTable.dialog.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.addButton, 
                    { 
                      backgroundColor: theme.primary,
                      borderColor: theme.border,
                      borderWidth: 1,
                      opacity: isSubmitting ? 0.7 : 1
                    }
                  ]}
                  onPress={submitNewTask}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={theme.buttonText} size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                      {t('taskTable.dialog.addTask')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: '80%',
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: theme => theme.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    height: 40,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dialogButton: {
    minWidth: 120,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: theme => theme.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    height: 40,
  },
  textArea: {
    minHeight: 80,
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  addButton: {
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteModal: {
    width: '85%',
  },
  deleteMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TaskTable;