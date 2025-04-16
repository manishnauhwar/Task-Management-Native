import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  TextInput as RNTextInput 
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  ActivityIndicator, 
  FAB, 
  Modal, 
  Portal, 
  TextInput, 
  Button, 
  Menu, 
  Divider 
} from 'react-native-paper';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [dueDateString, setDueDateString] = useState(formatDateForDisplay(new Date()));
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasksViewMode, setTasksViewMode] = useState('');

  // Load user and tasks initially
  useEffect(() => {
    loadUserAndFetchTasks();
  }, []);

  // Also reload data whenever the screen gains focus.
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

  // Date formatting functions
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
      setLoading(true);
      const newTask = {
        title,
        description,
        priority,
        status: 'To Do',
        dueDate: formatDateForBackend(parsedDate),
        assignedTo: user.id,
        userId: user.id  
      };
      console.log('Creating task with:', JSON.stringify(newTask, null, 2));
      const response = await axiosInstance.post('/tasks/post', newTask);
      if (response.data) {
        console.log('Task created successfully:', response.data);
        // Refresh tasks after adding
        await fetchTasks(user);
        closeModal();
      }
    } catch (error) {
      console.error('Error adding task:', error);
      console.error('Error response:', error.response?.data);
      alert(t('taskcards.failedToAddTask'));
    } finally {
      setLoading(false);
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

  const handleDateChange = (text) => {
    if (text.length === 2 && !text.includes('/')) {
      text = `${text}/`;
    } else if (text.length === 5 && text.charAt(2) === '/' && !text.includes('/', 3)) {
      text = `${text}/`;
    }
    setDueDateString(text);
    const parsedDate = parseDisplayDate(text);
    if (parsedDate) {
      setDueDate(parsedDate);
    }
  };

  const togglePriorityMenu = () => {
    setPriorityMenuVisible(!priorityMenuVisible);
  };

  // Summary stats for the cards
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
      console.log('Invalid date for task:', task.id);
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
      console.log('Invalid date for task:', task.id);
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

  const handleTitleChange = useCallback((text) => {
    setTitle(text);
  }, []);

  const handleDescriptionChange = useCallback((text) => {
    setDescription(text);
  }, []);

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Task Button */}
      <TouchableOpacity style={styles.addTaskButton} onPress={openModal}>
        <Icon name="plus-circle" size={24} color="#6366f1" />
        <Text style={styles.addTaskText}>{t('taskcards.addNewTask')}</Text>
      </TouchableOpacity>

      {/* Cards displaying summary stats */}
      <View style={styles.cardContainer}>
        <Card style={[styles.card, { backgroundColor: cardColors.total }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="format-list-bulleted" size={24} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Total Tasks</Text>
            <Text style={styles.cardValue}>{totalTasks}</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.card, { backgroundColor: cardColors.dueToday }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="calendar-today" size={24} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Due Today</Text>
            <Text style={styles.cardValue}>{tasksDueToday}</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.card, { backgroundColor: cardColors.completed }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="check-circle" size={24} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Completed</Text>
            <Text style={styles.cardValue}>{completedTasks}</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.card, { backgroundColor: cardColors.overdue }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="clock-alert" size={24} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Overdue</Text>
            <Text style={styles.cardValue}>{overdueTasks}</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.card, { backgroundColor: cardColors.inProgress }]}>
          <Card.Content style={styles.cardContent}>
            <Icon name="progress-clock" size={24} color="#fff" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>In Progress</Text>
            <Text style={styles.cardValue}>{inProgressTasks}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Add Task Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('taskcards.addNewTask')}</Text>
          <TextInput
            label={t('taskcards.titleLabel')}
            value={title}
            onChangeText={handleTitleChange}
            style={styles.input}
            mode="outlined"
            autoCapitalize="sentences"
            autoCorrect={false}
          />
          <TextInput
            label={t('taskcards.descriptionLabel')}
            value={description}
            onChangeText={handleDescriptionChange}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            autoCorrect={false}
          />
          <Menu
            visible={priorityMenuVisible}
            onDismiss={togglePriorityMenu}
            anchor={
              <TouchableOpacity style={styles.dropdownButton} onPress={togglePriorityMenu}>
                <Text style={[styles.dropdownButtonText, { flexWrap: 'wrap' }]}>
                  {t('taskcards.priorityLabel')} {priority}
                </Text>
                <Icon name="chevron-down" size={24} color="#6366f1" />
              </TouchableOpacity>
            }
          >
            <Menu.Item onPress={() => { setPriority('High'); togglePriorityMenu(); }} title="High" />
            <Menu.Item onPress={() => { setPriority('Medium'); togglePriorityMenu(); }} title="Medium" />
            <Menu.Item onPress={() => { setPriority('Low'); togglePriorityMenu(); }} title="Low" />
          </Menu>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateInputLabel}>{t('taskcards.dueDateLabel')}</Text>
            <RNTextInput
              style={styles.dateInput}
              value={dueDateString}
              onChangeText={handleDateChange}
              placeholder="MM/DD/YYYY"
              keyboardType="numeric"
              maxLength={10}
            />
            <Icon name="calendar" size={24} color="#6366f1" style={styles.dateInputIcon} />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.buttonContainer}>
            <Button mode="outlined" onPress={closeModal} style={styles.cancelButton} labelStyle={styles.buttonLabel}>
              {t('taskcards.cancel')}
            </Button>
            <Button mode="contained" onPress={handleAddTask} style={styles.addButton} labelStyle={styles.buttonLabel}>
              {t('taskcards.addTask')}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  loader: {
    marginTop: 20,
    alignItems: 'center'
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addTaskText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6366f1',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 10,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#fff',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  input: {
    marginBottom: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateInputLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flex: 1,
    borderRadius: 4,
  },
  dateInputIcon: {
    marginLeft: 10,
  },
  divider: {
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.45,
  },
  addButton: {
    flex: 0.45,
  },
  buttonLabel: {
    fontSize: 16,
  },
});

export default TaskCards;
