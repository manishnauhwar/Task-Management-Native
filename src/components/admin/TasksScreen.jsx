import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../../utils/axiosinstance';
import { getCurrentUser } from '../../utils/authService';
import { useTheme } from '../../utils/ThemeContext';
import { useNotification } from '../../utils/NotificationContext';
import TaskCard from './TaskCard';

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
        message: `Admin has assigned you a new task: "${task.title}"`,
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
            <TaskCard 
              key={task._id || task.id} 
              task={task} 
              teams={teams} 
              onAssignTask={handleAssignTask} 
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  taskHeader: {
    backgroundColor: '#3f51b5',
    marginTop: 10,
    marginHorizontal:5,
    borderRadius:5,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  tasksHeading: {
    color: '#fff',
   
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    padding: 8,
  },
  loadingCard: {
    margin: 16,
    padding: 16,
  },
  emptyCard: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
});

export default TasksScreen;