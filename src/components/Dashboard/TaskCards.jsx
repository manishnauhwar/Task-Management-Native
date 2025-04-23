import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  ActivityIndicator,
  FAB,
  Modal as PaperModal,
  Portal,
  TextInput as RNTextInput
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../../utils/axiosinstance';
import { useTheme } from '../../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../../utils/authService';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

const TaskCards = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueDateString, setDueDateString] = useState(formatDateForDisplay(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasksViewMode, setTasksViewMode] = useState('');

  useEffect(() => {
    loadUserAndFetchTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserAndFetchTasks();
    }, [])
  );

  const loadUserAndFetchTasks = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await fetchTasks(currentUser);
      } else {
        console.error('No user found');
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
      const tasksResponse = await axiosInstance.get('/tasks');
      if (currentUser.role === 'admin') {
        setTasks(tasksResponse.data);
        setTasksViewMode('all');
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
          const managerTasks = tasksResponse.data.filter(task =>
            task.userId === currentUser.id ||
            teamMemberIds.includes(task.userId) ||
            task.assignedTo === currentUser.id ||
            teamMemberIds.includes(task.assignedTo)
          );
          setTasks(managerTasks);
          setTasksViewMode('team');
        } catch (error) {
          console.error('Error fetching teams:', error);
          const managerTasks = tasksResponse.data.filter(
            task => task.userId === currentUser.id || task.assignedTo === currentUser.id
          );
          setTasks(managerTasks);
          setTasksViewMode('personal');
        }
      } else {
        const userTasks = tasksResponse.data.filter(
          task => task.userId === currentUser.id || task.assignedTo === currentUser.id
        );
        setTasks(userTasks);
        setTasksViewMode('personal');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  function formatDateForBackend(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  function isValidDateFormat(dateString) {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    return regex.test(dateString);
  }

  function parseDisplayDate(dateString) {
    if (!isValidDateFormat(dateString)) return null;
    const [month, day, year] = dateString.split('/');
    return new Date(year, parseInt(month) - 1, day);
  }

  const handleAddTask = async () => {
    if (!title.trim()) {
      alert(t('taskcards.pleaseEnterTaskTitle'));
      return;
    }
    if (!description.trim()) {
      alert(t('taskcards.pleaseEnterTaskDescription'));
      return;
    }
    const parsedDate = parseDisplayDate(dueDateString);
    if (!parsedDate) {
      alert(t('taskcards.invalidDate'));
      return;
    }
    if (!user) {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          alert(t('taskcards.unableToDetermineUser'));
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user data:', error);
        alert(t('taskcards.failedToGetUserData'));
        return;
      }
    }
    try {
      setAddingTask(true);
      const newTask = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'To Do',
        dueDate: formatDateForBackend(parsedDate),
        assignedTo: user.id,
        userId: user.id
      };
      const response = await axiosInstance.post('/tasks/post', newTask);
      if (response.data) {
        await fetchTasks(user);
        closeModal();
      }
    } catch (error) {
      console.error('Error adding task:', error);
      alert(t('taskcards.failedToAddTask'));
    } finally {
      setAddingTask(false);
    }
  };

  const openModal = async () => {
    if (!user) {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setDueDate(new Date());
    setDueDateString(formatDateForDisplay(new Date()));
  };

  const handleTitleChange = (text) => {
    setTitle(text);
  };

  const handleDescriptionChange = (text) => {
    setDescription(text);
  };

  const handleDateChange = (text) => {
    setDueDateString(text);
    if (text.length === 2 || text.length === 5) {
      const shouldAddSlash = text.length === 2 || (text.length === 5 && text.charAt(2) === '/');
      if (shouldAddSlash && !text.endsWith('/')) {
        setDueDateString(text + '/');
      }
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
    setDueDateString(formatDateForDisplay(currentDate));
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const togglePriorityMenu = () => {
    setPriorityMenuVisible(!priorityMenuVisible);
  };

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(task => task.status?.toLowerCase() === 'completed').length || 0;
  const inProgressTasks = tasks?.filter(task =>
    task.status?.toLowerCase() === 'to do' ||
    task.status?.toLowerCase() === 'in progress'
  ).length || 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tasksDueToday = tasks?.filter(task => {
    if (!task.dueDate) return false;
    try {
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      return taskDueDate.getTime() === today.getTime();
    } catch (error) {
      // console.log('Invalid date for task:', task.id);
      return false;
    }
  }).length || 0;
  const overdueTasks = tasks?.filter(task => {
    if (!task.dueDate) return false;
    try {
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0);
      return taskDueDate < today && task.status?.toLowerCase() !== 'completed';
    } catch (error) {
      // console.log('Invalid date for task:', task.id);
      return false;
    }
  }).length || 0;

  const cardColors = {
    total: '#6366f1',
    dueToday: '#8b5cf6',
    completed: '#10b981',
    overdue: '#f43f5e',
    inProgress: '#0ea5e9',
  };

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#f43f5e';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#10b981';
      default:
        return '#f59e0b';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.addTaskButton, { borderColor: theme.border }]} 
            onPress={openModal}
          >
            <Icon name="plus-circle" size={24} color={theme.primary} />
            <Text style={[styles.addTaskText, { color: theme.primary }]}>
              {t('taskcards.addNewTask')}
            </Text>
          </TouchableOpacity>
          <View style={styles.cardContainer}>
            <Card style={[styles.card, { backgroundColor: cardColors.total }]}>
              <Card.Content style={styles.cardContent}>
                <Icon name="format-list-bulleted" size={24} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{t('taskcards.totaltask')}</Text>
                <Text style={styles.cardValue}>{totalTasks}</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.card, { backgroundColor: cardColors.dueToday }]}>
              <Card.Content style={styles.cardContent}>
                <Icon name="calendar-today" size={24} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{t('taskcards.duetoday')}</Text>
                <Text style={styles.cardValue}>{tasksDueToday}</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.card, { backgroundColor: cardColors.completed }]}>
              <Card.Content style={styles.cardContent}>
                <Icon name="check-circle" size={24} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{t('taskcards.completed')}</Text>
                <Text style={styles.cardValue}>{completedTasks}</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.card, { backgroundColor: cardColors.overdue }]}>
              <Card.Content style={styles.cardContent}>
                <Icon name="clock-alert" size={24} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{t('taskcards.overdue')}</Text>
                <Text style={styles.cardValue}>{overdueTasks}</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.card, { backgroundColor: cardColors.inProgress }]}>
              <Card.Content style={styles.cardContent}>
                <Icon name="progress-clock" size={24} color="#fff" style={styles.cardIcon} />
                <Text style={styles.cardTitle}>{t('taskcards.pendingTasks')}</Text>
                <Text style={styles.cardValue}>{inProgressTasks}</Text>
              </Card.Content>
            </Card>
          </View>
        </>
      )}

      <Modal
        visible={modalVisible}
        onRequestClose={() => !addingTask && closeModal()}
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
              maxHeight: '90%',
            }
          ]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]} adjustsFontSizeToFit numberOfLines={1}>
                {t('taskcards.addNewTask')}
              </Text>
              <TouchableOpacity 
                onPress={closeModal} 
                disabled={addingTask}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalBody}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskcards.titleLabel')}
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  style={[
                    styles.textInput, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                      minHeight: 40,
                      height: 'auto',
                    }
                  ]}
                  placeholder={t('taskcards.titleLabel')}
                  placeholderTextColor={theme.placeholderText}
                  editable={!addingTask}
                  autoCapitalize="sentences"
                  maxLength={100}
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskcards.descriptionLabel')}
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  style={[
                    styles.textInput, 
                    styles.textArea, 
                    { 
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                      height: 'auto',
                    }
                  ]}
                  placeholder={t('taskcards.descriptionLabel')}
                  placeholderTextColor={theme.placeholderText}
                  multiline
                  numberOfLines={4}
                  editable={!addingTask}
                  autoCapitalize="sentences"
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskcards.priorityLabel')}
                </Text>
                <View style={styles.priorityButtons}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        { 
                          backgroundColor: priority === p ? theme.primary : theme.inputBackground,
                          borderColor: theme.border,
                          opacity: addingTask ? 0.7 : 1
                        }
                      ]}
                      onPress={() => !addingTask && setPriority(p)}
                      disabled={addingTask}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        { color: priority === p ? theme.buttonText : theme.text }
                      ]} numberOfLines={1} adjustsFontSizeToFit>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {t('taskcards.dueDateLabel')}
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton, 
                    { 
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.border,
                      minHeight: 40,
                      height: 'auto',
                    }
                  ]}
                  onPress={showDatepicker}
                  disabled={addingTask}
                >
                  <Text style={[styles.datePickerText, { color: theme.text }]}>
                    {dueDateString}
                  </Text>
                  <Icon name="calendar" size={20} color={theme.text} />
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    testID="dateTimePicker"
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
                  />
                )}
              </View>
            </ScrollView>

            <View style={[styles.buttonContainer, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.cancelButton, 
                  { 
                    borderColor: theme.border,
                    opacity: addingTask ? 0.7 : 1,
                    minHeight: 44,
                  }
                ]} 
                onPress={closeModal}
                disabled={addingTask}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  {t('taskcards.cancel')}
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
                    opacity: addingTask ? 0.7 : 1,
                    minHeight: 44,
                  }
                ]} 
                onPress={handleAddTask}
                disabled={addingTask}
              >
                {addingTask ? (
                  <ActivityIndicator color={theme.buttonText} size="small" />
                ) : (
                  <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                    {t('taskcards.addTask')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addTaskText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    flexGrow: 1,
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
    flex: 1,
    paddingRight: 10,
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
  },
  textArea: {
    minHeight: 80,
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
    minHeight: 36,
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 14,
  },
});

export default TaskCards;