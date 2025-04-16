import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Title, Chip, useTheme, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../utils/axiosinstance';
import { getCurrentUser } from '../utils/authService';
import { useTheme as useCustomTheme } from '../utils/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';

const UserScreen = () => {
  const paperTheme = useTheme();
  const { theme } = useCustomTheme();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const statusTabs = [
    { id: 'all', label: t('user.allTasks') },
    { id: 'Completed', label: t('user.completed') },
    { id: 'To Do', label: t('user.toDo') },
    { id: 'In progress', label: t('user.inProgress') }
  ];

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const currentUser = await getCurrentUser();
          setUser(currentUser);

          if (!currentUser) {
            setLoading(false);
            return;
          }

          const tasksResponse = await axiosInstance.get('/tasks');

          if (currentUser.role === 'admin') {
            setTasks(tasksResponse.data);
          } else if (currentUser.role === 'manager') {
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
          } else {
            const userTasks = tasksResponse.data.filter(
              task => task.userId === currentUser.id || task.assignedTo === currentUser.id
            );
            setTasks(userTasks);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(t('user.failedToLoadTasks'));
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [t])
  );

  useEffect(() => {
    filterTasksByStatus();
  }, [tasks, selectedStatus]);

  const filterTasksByStatus = () => {
    if (selectedStatus === 'all') {
      setFilteredTasks(tasks);
      return;
    }
    const filtered = tasks.filter(task => task.status === selectedStatus);
    setFilteredTasks(filtered);
  };

  const getStatusColor = (status) => {
    if (!status) return paperTheme.colors.surfaceVariant;
    status = status.toLowerCase();
    if (status === 'completed') return '#4ade80';
    if (status === 'in progress') return '#facc15';
    if (status === 'to do') return '#60a5fa';
    if (status === 'overdue') return '#f87171';
    return paperTheme.colors.surfaceVariant;
  };

  const getStatusCardColor = (status) => {
    if (!status) return '#f3f4f6';
    status = status.toLowerCase();
    if (status === 'completed') return '#ecfdf5';
    if (status === 'in progress') return '#fef9c3';
    if (status === 'to do') return '#dbeafe';
    if (status === 'overdue') return '#fee2e2';
    return '#f3f4f6';
  };

  const getPriorityColor = (priority) => {
    if (!priority) return paperTheme.colors.surfaceVariant;
    priority = priority.toLowerCase();
    if (priority === 'high') return '#ef4444';
    if (priority === 'medium') return '#fb923c';
    if (priority === 'low') return '#60a5fa';
    return paperTheme.colors.surfaceVariant;
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('user.noDate');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return t('user.invalidDate');
    }
  };

  const getInitials = (title) => {
    if (!title) return '?';
    return title.substring(0, 2).toUpperCase();
  };

  const getStatusIcon = (status) => {
    if (!status) return 'help-circle-outline';
    status = status.toLowerCase();
    if (status === 'completed') return 'check-circle';
    if (status === 'in progress') return 'clock-outline';
    if (status === 'to do') return 'calendar-blank-outline';
    if (status === 'overdue') return 'alert-circle';
    return 'help-circle-outline';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color={paperTheme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <Text style={{ color: theme.text }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <Title style={[styles.title, { color: theme.text }]}>
          {user?.role === 'admin' || user?.role === 'manager' ? t('user.tasks') : t('user.myTasks')}
        </Title>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusTabsContainer}
          contentContainerStyle={styles.statusTabsContent}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.statusTab,
                selectedStatus === tab.id && styles.selectedStatusTab,
                { backgroundColor: selectedStatus === tab.id ? getStatusColor(tab.id) : theme.cardBackground }
              ]}
              onPress={() => setSelectedStatus(tab.id)}
            >
              <Text style={[styles.statusTabText, { color: selectedStatus === tab.id ? '#ffffff' : theme.text }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredTasks.length === 0 ? (
          <Text style={[styles.emptyMessage, { color: theme.text }]}>
            {t('user.noTasksFound')}
          </Text>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredTasks.map(task => (
              <TouchableOpacity key={task._id} activeOpacity={0.7}>
                <Card style={[styles.card, { backgroundColor: getStatusCardColor(task.status) }]} elevation={2}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeftBorder} backgroundColor={getStatusColor(task.status)} />
                    <View style={styles.cardMainContent}>
                      <View style={styles.cardHeader}>
                        <Avatar.Text
                          size={40}
                          label={getInitials(task.title)}
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        />
                        <View style={styles.titleContainer}>
                          <Text style={styles.taskTitle} numberOfLines={1}>
                            {task.title}
                          </Text>
                          <View style={styles.dateContainer}>
                            <Icon name="calendar" size={14} color="#6B7280" />
                            <Text style={styles.dateText}>
                              {formatDate(task.dueDate)}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(task.status) }]}>
                          <Icon name={getStatusIcon(task.status)} size={16} color="#FFFFFF" />
                        </View>
                      </View>
                      {task.description && (
                        <Text style={styles.description} numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                      <View style={styles.cardFooter}>
                        <Chip
                          style={[styles.priorityChip, { backgroundColor: 'transparent', borderColor: getPriorityColor(task.priority) }]}
                          textStyle={{ color: getPriorityColor(task.priority), fontSize: 12, fontWeight: '600' }}
                        >
                          {task.priority || t('user.noPriority')}
                        </Chip>
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default UserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusTabsContainer: {
    marginBottom: 16,
    maxHeight: 40,
  },
  statusTabsContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    elevation: 2,
    height: 32,
    justifyContent: 'center',
  },
  selectedStatusTab: {
    elevation: 4,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardLeftBorder: {
    width: 6,
    height: '100%',
  },
  cardMainContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  priorityChip: {
    borderWidth: 1,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
  },
});
