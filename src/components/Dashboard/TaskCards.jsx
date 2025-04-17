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
        <ActivityIndicator size="large" color={theme.primaryColor || '#6366f1'} />
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
      <TouchableOpacity 
        style={[styles.addTaskButton, { borderColor: theme.borderColor }]} 
        onPress={openModal}
      >
        <Icon name="plus-circle" size={24} color={theme.primaryColor || '#6366f1'} />
        <Text style={[styles.addTaskText, { color: theme.primaryColor || '#6366f1' }]}>
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
            <Text style={styles.cardTitle}>{t('taskcards.inprogress')}</Text>
            <Text style={styles.cardValue}>{inProgressTasks}</Text>
          </Card.Content>
        </Card>
      </View>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={[
            styles.modalContainer, 
            { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              shadowColor: theme.shadowColor || 'rgba(0, 0, 0, 0.1)'
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.headingText }]}>
              {t('taskcards.addNewTask')}
            </Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <Divider style={[styles.divider, { backgroundColor: theme.borderColor }]} />
          
          <View style={styles.modalBody}>
            <TextInput
              label={t('taskcards.titleLabel')}
              value={title}
              onChangeText={handleTitleChange}
              style={styles.input}
              mode="outlined"
              autoCapitalize="sentences"
              autoCorrect={false}
              outlineColor={theme.inputBorder}
              activeOutlineColor={theme.primaryColor}
              textColor={theme.text}
              theme={{ colors: { text: theme.text, placeholder: theme.placeholderText } }}
            />
            
            <TextInput
              label={t('taskcards.descriptionLabel')}
              value={description}
              onChangeText={handleDescriptionChange}
              style={[styles.input, styles.textArea]}
              mode="outlined"
              multiline
              numberOfLines={4}
              autoCapitalize="sentences"
              autoCorrect={false}
              outlineColor={theme.inputBorder}
              activeOutlineColor={theme.primaryColor}
              textColor={theme.text}
              theme={{ colors: { text: theme.text, placeholder: theme.placeholderText } }}
            />
            
            <View style={styles.priorityContainer}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                {t('taskcards.priorityLabel')}
              </Text>
              
              <Menu
                visible={priorityMenuVisible}
                onDismiss={togglePriorityMenu}
                contentStyle={{ backgroundColor: theme.cardBackground }}
                anchor={
                  <TouchableOpacity 
                    style={[
                      styles.dropdownButton, 
                      { 
                        borderColor: theme.inputBorder,
                        backgroundColor: theme.inputBackground || 'transparent'
                      }
                    ]} 
                    onPress={togglePriorityMenu}
                  >
                    <View style={styles.priorityBadgeContainer}>
                      <View 
                        style={[
                          styles.priorityBadge, 
                          { backgroundColor: getPriorityColor(priority) }
                        ]} 
                      />
                      <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                        {priority}
                      </Text>
                    </View>
                    <Icon name="chevron-down" size={20} color={theme.iconColor || theme.text} />
                  </TouchableOpacity>
                }
              >
                <Menu.Item 
                  onPress={() => { setPriority('High'); togglePriorityMenu(); }} 
                  title="High" 
                  titleStyle={{ color: theme.text }}
                  leadingIcon="flag"
                />
                <Menu.Item 
                  onPress={() => { setPriority('Medium'); togglePriorityMenu(); }} 
                  title="Medium" 
                  titleStyle={{ color: theme.text }}
                  leadingIcon="flag"
                />
                <Menu.Item 
                  onPress={() => { setPriority('Low'); togglePriorityMenu(); }} 
                  title="Low" 
                  titleStyle={{ color: theme.text }}
                  leadingIcon="flag"
                />
              </Menu>
            </View>
            
            <View style={styles.dateSection}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                {t('taskcards.dueDateLabel')}
              </Text>
              
              <View style={[
                styles.dateInputContainer,
                { 
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground || 'transparent'
                }
              ]}>
                <RNTextInput
                  style={[styles.dateInput, { color: theme.text }]}
                  value={dueDateString}
                  onChangeText={handleDateChange}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={theme.placeholderText}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Icon 
                  name="calendar" 
                  size={20} 
                  color={theme.primaryColor || '#6366f1'} 
                  style={styles.dateInputIcon} 
                />
              </View>
            </View>
          </View>
          
          <Divider style={[styles.divider, { backgroundColor: theme.borderColor }]} />
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={closeModal} 
              style={[styles.cancelButton, { borderColor: theme.borderColor }]} 
              labelStyle={[styles.buttonLabelCancel, { color: theme.text }]}
              textColor={theme.text}
            >
              {t('taskcards.cancel')}
            </Button>
            
            <Button 
              mode="contained" 
              onPress={handleAddTask} 
              style={[styles.addButton, { backgroundColor: theme.primaryColor || '#6366f1' }]} 
              labelStyle={styles.buttonLabel}
            >
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
  // Modal Styles - Enhanced
  modalContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    height: 120,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 50,
  },
  priorityBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 4,
    paddingLeft: 12,
    paddingRight: 12,
    height: 50,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
  },
  dateInputIcon: {
    marginLeft: 10,
  },
  divider: {
    height: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  cancelButton: {
    flex: 0.48,
    borderWidth: 1,
  },
  addButton: {
    flex: 0.48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 2,
  },
  buttonLabelCancel: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 2,
  },
});

export default TaskCards;