import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser } from '../utils/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'https://67dd0778e00db03c4069dbf8.mockapi.io/users/U6';
const TASK_API_URL = 'https://67dd0778e00db03c4069dbf8.mockapi.io/tasks';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [incompleteTasks, setIncompleteTasks] = useState([]);
  const [averageCompletionTime, setAverageCompletionTime] = useState(0);

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          console.error('No user found');
          return;
        }

        setUser(currentUser);

        const response = await fetch(TASK_API_URL);
        if (!response.ok) throw new Error("Failed to fetch tasks");

        const data = await response.json();
        const tasksArray = Array.isArray(data) ? data : data.tasks || [];

        const userTasks = tasksArray.filter(task => task.assignedTo === currentUser.id);
        const completedTasksList = userTasks.filter(task => task.status === "Completed");
        const incompleteTasksList = userTasks.filter(task => task.status !== "Completed");

        setTasks(userTasks);
        setCompletedTasks(completedTasksList);
        setIncompleteTasks(incompleteTasksList);

        if (completedTasksList.length > 0) {
          const totalMinutes = completedTasksList.reduce((total, task) => {
            if (task.completionTime && typeof task.completionTime === 'string') {
              const [hours, minutes] = task.completionTime.split(':').map(Number);
              return total + (hours * 60 + minutes);
            }
            return total;
          }, 0);

          const averageHours = (totalMinutes / completedTasksList.length) / 60;
          setAverageCompletionTime(Number(averageHours.toFixed(2)));
        }

      } catch (error) {
        console.error("Error fetching user data and tasks:", error);
        setTasks([]);
        setCompletedTasks([]);
        setIncompleteTasks([]);
        setAverageCompletionTime(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, []);

  const editDetail = async () => {
    setModalOpen(false);
    if (!user.name || !user.email || !user.password) {
      alert('Please fill all fields!');
      return;
    }

    try {
      const updateUrl = `https://67dd0778e00db03c4069dbf8.mockapi.io/users/${user.id}`;
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      if (response.ok) {
 
        await AsyncStorage.setItem('@user_data', JSON.stringify(user));
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while updating the profile');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle} />
      <View style={styles.headerview}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Account')}>
          <Icon name="arrow-back-ios" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.section, {
          backgroundColor: theme.cardBackground,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>User Details</Text>
          <View style={[styles.contentCard, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
          }]}>
            <Text style={[styles.text, { color: theme.text }]}>Name: {user.name}</Text>
            <Text style={[styles.text, { color: theme.text }]}>Email: {user.email}</Text>
            <Text style={[styles.text, { color: theme.text }]}>Role: {user.role}</Text>
            <TouchableOpacity style={[styles.button, {
              backgroundColor: theme.primary,
              shadowColor: theme.shadowColor,
            }]} onPress={() => setModalOpen(true)}>
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, {
          backgroundColor: theme.cardBackground,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>User Stats</Text>
          <View style={[styles.contentCard, {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
          }]}>
            <View style={styles.statItem}>
              <View style={[styles.statBox, {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.shadowColor,
              }]}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed Tasks</Text>
                <Text style={[styles.statValue, { color: theme.statValueColor }]}>{completedTasks.length}</Text>
              </View>
              <View style={[styles.statBox, {
                backgroundColor: theme.cardBackground,
                shadowColor: theme.shadowColor,
              }]}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Average Time</Text>
                <Text style={[styles.statValue, { color: theme.statValueColor }]}>{averageCompletionTime.toFixed(2)}h</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, {
          backgroundColor: theme.cardBackground,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tasks to be Done</Text>
          {Array.isArray(incompleteTasks) && incompleteTasks.length > 0 ? (
            incompleteTasks.map((task) => (
              <View key={task.id} style={[styles.taskCard, {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: theme.shadowColor,
              }]}>
                <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                <View style={styles.taskDetailsContainer}>
                  <View style={styles.taskDetailItem}>
                    <Icon name="event" size={16} color={theme.textSecondary} />
                    <Text style={[styles.taskDetails, { color: theme.textSecondary }]}>Due: {task.dueDate}</Text>
                  </View>
                  <View style={styles.taskDetailItem}>
                    <Icon name="flag" size={16} color={theme.textSecondary} />
                    <Text style={[styles.taskDetails, { color: theme.textSecondary }]}>{task.priority}</Text>
                  </View>
                  <View style={styles.taskDetailItem}>
                    <Icon name="info" size={16} color={theme.textSecondary} />
                    <Text style={[styles.taskDetails, { color: theme.textSecondary }]}>{task.status}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.contentCard, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            }]}>
              <Text style={[styles.noTaskText, { color: theme.textSecondary }]}>No pending tasks</Text>
            </View>
          )}
        </View>

        <Modal visible={modalOpen} animationType="slide" transparent>
          <View style={styles.modalWrapper}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="Name"
                placeholderTextColor={theme.placeholder}
                value={user.name}
                onChangeText={(text) => setUser({ ...user, name: text })}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                value={user.email}
                onChangeText={(text) => setUser({ ...user, email: text })}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.placeholder}
                value={user.password}
                onChangeText={(text) => setUser({ ...user, password: text })}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, {
                    backgroundColor: theme.primary,
                    shadowColor: theme.shadowColor,
                  }]}
                  onPress={editDetail}
                >
                  <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelModalButton, {
                    backgroundColor: theme.danger,
                    shadowColor: theme.shadowColor,
                  }]}
                  onPress={() => setModalOpen(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};


export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  headerview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 10,
    gap: 30,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 15,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  contentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  text: {
    fontSize: 16,
    color: 'black',
    marginBottom: 5
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 15,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center'
  },

  // Task Section
  taskContainer: {
    marginTop: 20
  },
  taskHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10
  },

  taskCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  taskDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  taskDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  taskDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  noTaskText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    padding: 20,
  },

  // Modal Styling
  modalWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cancelModalButton: {
    padding: 10,
    borderRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16
  },

  statsContainer: {
    marginVertical: 20,
  },
  statsHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: 'black',
  },
  statsCard: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    padding: 15,
    borderRadius: 10,
    minWidth: '45%',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#008B8B',
  },
});
