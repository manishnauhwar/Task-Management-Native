import React, { useEffect, useState, createContext, useContext, useCallback } from "react";
import { StatusBar, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import Svg, { Path } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import axiosInstance from "../utils/axiosinstance";
import { Card } from "react-native-paper";
import { getCurrentUser } from "../utils/authService"; 
import { useTranslation } from "react-i18next";
import { useNavigationBar } from "../../App";

const Stack = createStackNavigator();
const TasksContext = createContext();

// Icon Components
const CalendarIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 8h18M8 3v2m8-2v2m-8 4v8m4-8v8m4-8v8M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
  </Svg>
);

const BackIcon = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const ThreeDotsIcon = ({ color }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <Path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <Path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </Svg>
);

// Status Button Component
const StatusButton = ({ title, color, onPress }) => (
  <TouchableOpacity style={[styles.statusButton, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.statusButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Task Card Component
const TaskCard = ({ task, theme }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { updateTaskStatus, updatingTaskId } = useContext(TasksContext);
  const { t } = useTranslation();

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const handleStatusChange = (newStatus) => {
    updateTaskStatus(task._id, newStatus);
    setMenuVisible(false);
  };

  const statusOptions = [
    { title: t('taskCard.statusOption.toDo', 'To Do'), status: "To Do", color: "#3498db" },
    { title: t('taskCard.statusOption.inProgress', 'In Progress'), status: "In Progress", color: "#f39c12" },
    { title: t('taskCard.statusOption.completed', 'Completed'), status: "Completed", color: "#2ecc71" }
  ].filter(option => option.status.toLowerCase() !== task.status?.toLowerCase());

  const formatDate = dateString => dateString ? new Date(dateString).toLocaleDateString() : t('taskCard.noDueDate', 'No due date');
  const getPriorityColor = priority => {
    switch ((priority || '').toLowerCase()) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };
  const formatCreatedAt = dateString => dateString ? new Date(dateString).toLocaleDateString() : t('taskCard.unknown', 'Unknown');

  return (
    <Card style={[styles.taskCard, { backgroundColor: theme.taskCardBg, borderColor: theme.taskBorderColor }]}>      
      <Card.Content>
        {updatingTaskId === task._id && (
          <View style={[styles.loadingOverlay, { backgroundColor: `${theme.taskCardBg}CC` }]}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton} disabled={updatingTaskId === task._id}>
            <ThreeDotsIcon color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.taskDetails}>
          <View style={styles.taskDetail}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>              
              <Text style={styles.priorityText}>{task.priority || t('taskCard.normal', 'Normal')}</Text>
            </View>
          </View>
          <View style={styles.taskDetail}>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>              {t('taskCard.due', 'Due')}: {formatDate(task.dueDate)}
            </Text>
          </View>
          <View style={styles.taskDetail}>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>              {t('taskCard.created', 'Created')}: {formatCreatedAt(task.createdAt)}
            </Text>
          </View>
        </View>
        {menuVisible && (
          <View style={[styles.menuDropdown, { backgroundColor: theme.cardBackground }]}>            
            <Text style={[styles.menuHeader, { color: theme.text }]}>{t('taskCard.moveTo', 'Move to:')}</Text>
            {statusOptions.map(option => (
              <TouchableOpacity
                key={option.status}
                style={[styles.menuItem, { borderLeftColor: option.color }]}
                onPress={() => handleStatusChange(option.status)}
              >
                <Text style={[styles.menuItemText, { color: theme.text }]}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const StatusPage = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isGestureNavigationEnabled, bottomInset } = useNavigationBar();
  const { status, statusColor } = route.params;
  const { tasks } = useContext(TasksContext);
  const navigation = useNavigation();
  const filteredTasks = tasks.filter(task => task.status?.toLowerCase() === status.toLowerCase());

  const getTabBarWithGestureSpacing = () => {
    const tabBarHeight = 60;
    return tabBarHeight + (isGestureNavigationEnabled ? bottomInset : 0);
  };

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >      
      <StatusBar backgroundColor={statusColor} barStyle="light-content" />
      <View style={[styles.statusPageHeader, { backgroundColor: statusColor }]}>        
        <TouchableOpacity style={styles.backButtonContainer} onPress={() => navigation.goBack()}>
          <BackIcon color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.statusPageTitle}>{status}</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={[
        styles.taskListContainer,
        { paddingBottom: getTabBarWithGestureSpacing() }
      ]}>
        {filteredTasks.length > 0 ? (
          <FlatList
            data={filteredTasks}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <TaskCard task={item} theme={theme} />}
            contentContainerStyle={{
              ...styles.taskList,
              paddingBottom: getTabBarWithGestureSpacing()
            }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              {t('statusPage.noTasks', 'No tasks in this status')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const KanbanBoardMain = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isGestureNavigationEnabled, bottomInset } = useNavigationBar();
  const { tasks, loading, refreshTasks } = useContext(TasksContext);
  const { t } = useTranslation();
  
  const getBottomSpacing = () => {
    const tabBarHeight = 60;
    return tabBarHeight + (isGestureNavigationEnabled ? bottomInset : 0);
  };

  useFocusEffect(useCallback(() => {
    refreshTasks();
  }, [refreshTasks]));

  const statusOptions = [
    { title: t('kanban.status.toDo', 'To Do'), status: "To Do", color: "#3498db" },
    { title: t('kanban.status.inProgress', 'In Progress'), status: "In Progress", color: "#f39c12" },
    { title: t('kanban.status.completed', 'Completed'), status: "Completed", color: "#2ecc71" }
  ];
  const navigateToStatus = (status, color) => navigation.navigate("StatusPage", { status, statusColor: color });

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >      
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.calendarButton} onPress={() => navigation.navigate("Calendar", { tasks })}>
          <CalendarIcon color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>{t('kanban.boardTitle', 'Kanban Board')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <View style={[
          styles.mainContainer,
          { paddingBottom: getBottomSpacing() }
        ]}>
          <View style={styles.statusButtonsContainer}>
            {statusOptions.map(option => (
              <StatusButton key={option.status} title={option.title} color={option.color} onPress={() => navigateToStatus(option.status, option.color)} />
            ))}
          </View>
          <View style={styles.statsContainer}>
            <Text style={[styles.statsTitle, { color: theme.text }]}>{t('kanban.tasksOverview', 'Tasks Overview')}</Text>
            <View style={styles.statCards}>
              {statusOptions.map(option => {
                const count = tasks.filter(task => 
                  task.status?.toLowerCase() === option.status.toLowerCase()
                ).length;
                return (
                  <TouchableOpacity
                    key={option.status}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.statCardBg,
                        borderLeftWidth: 4,
                        borderLeftColor: option.color,
                        shadowColor: theme.shadowColor,
                      }
                    ]}
                    onPress={() => navigateToStatus(option.status, option.color)}
                  >
                    <Text style={[styles.statCount, { color: option.color }]}>{count}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{option.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// Tasks Provider
const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const loadUserAndFetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert(t('tasksProvider.error', 'Error'), t('tasksProvider.failedLoadUser', 'Failed to load user information'), [{ text: t('tasksProvider.ok', 'OK'), onPress: () => navigation.navigate("Login") }]);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      const tasksResponse = await axiosInstance.get('/tasks');
      if (currentUser.role === 'admin') {
        setTasks(tasksResponse.data);
      } else if (currentUser.role === 'manager') {
        try {
          const teamsResponse = await axiosInstance.get('/teams');
          const managedTeams = teamsResponse.data.filter(team => team.manager._id === currentUser.id);
          const memberIds = managedTeams.flatMap(team => team.members?.map(m => m._id) || []);
          setTeamMembers(memberIds);
          const managerTasks = tasksResponse.data.filter(task => task.userId === currentUser.id || memberIds.includes(task.userId) || task.assignedTo === currentUser.id || memberIds.includes(task.assignedTo));
          setTasks(managerTasks);
        } catch (err) {
          console.error('Error fetching teams:', err);
          setTasks(tasksResponse.data.filter(task => task.userId === currentUser.id || task.assignedTo === currentUser.id));
        }
      } else {
        setTasks(tasksResponse.data.filter(task => task.userId === currentUser.id || task.assignedTo === currentUser.id));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        Alert.alert(t('tasksProvider.sessionExpired', 'Session Expired'), t('tasksProvider.loginAgain', 'Please login again to continue'), [{ text: t('tasksProvider.ok', 'OK'), onPress: () => navigation.navigate("Login") }]);
      } else {
        Alert.alert(t('tasksProvider.error', 'Error'), t('tasksProvider.failedLoadTasks', 'Failed to load tasks. Please try again.'));
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [navigation, t]);

  useEffect(() => { loadUserAndFetchTasks(); }, [loadUserAndFetchTasks]);

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      if (!taskId) return;
      setUpdatingTaskId(taskId);
      const response = await axiosInstance.patch(`/tasks/${taskId}`, { status: newStatus });
      if (response.data) setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert(t('tasksProvider.sessionExpired', 'Session Expired'), t('tasksProvider.loginAgain', 'Please login again to continue'), [{ text: t('tasksProvider.ok', 'OK'), onPress: () => navigation.navigate("Login") }]);
      } else {
        Alert.alert(t('tasksProvider.error', 'Error'), t('tasksProvider.failedStatusUpdate', 'Failed to update task status. Please try again.'));
      }
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return <TasksContext.Provider value={{ tasks, loading, user, teamMembers, updateTaskStatus, refreshTasks: loadUserAndFetchTasks, updatingTaskId }}>{children}</TasksContext.Provider>;
};

const KanbanStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: "#fff" } }}>
    <Stack.Screen name="KanbanMain" component={KanbanBoardMain} />
    <Stack.Screen name="StatusPage" component={StatusPage} />
  </Stack.Navigator>
);

const KanbanBoardScreen = () => (
  <TasksProvider>
    <KanbanStack />
  </TasksProvider>
);

export default KanbanBoardScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  calendarButton: { position: "absolute", left: 20 },
  heading: { fontSize: 26, fontWeight: "700", letterSpacing: 0.5 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  mainContainer: { flex: 1, padding: 16 },
  statusButtonsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  statusButton: { flex: 1, paddingVertical: 16, marginHorizontal: 6, borderRadius: 12, alignItems: "center", justifyContent: "center", elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statusButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  statsContainer: { marginTop: 16 },
  statsTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  statCards: { flexDirection: "row", justifyContent: "space-between" },
  statCard: { flex: 1, borderRadius: 12, padding: 16, marginHorizontal: 6, alignItems: "center", justifyContent: "center", elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statCount: { fontSize: 32, fontWeight: "bold" },
  statLabel: { fontSize: 14, marginTop: 5 },
  taskCard: { borderRadius: 8, marginBottom: 12, borderWidth: 1, overflow: "hidden" },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  taskTitle: { fontWeight: "600", fontSize: 16, flex: 1 },
  taskDetails: { marginTop: 4 },
  taskDetail: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  priorityText: { color: "white", fontSize: 12, fontWeight: "600" },
  detailText: { fontSize: 14 },
  menuButton: { padding: 4 },
  menuDropdown: { position: "absolute", top: 12, right: 32, borderRadius: 4, padding: 8, zIndex: 1000, borderWidth: 1 },
  menuHeader: { fontSize: 12, fontWeight: "500", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#eee" },
  menuItem: { paddingVertical: 6, paddingHorizontal: 4, borderLeftWidth: 3, marginVertical: 1 },
  menuItemText: { fontSize: 12 },
  statusPageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, margin: 12 },
  backButtonContainer: { padding: 8, borderRadius: 20 },
  statusPageTitle: { fontSize: 22, fontWeight: "700", color: "white", letterSpacing: 1 },
  headerRight: { width: 40 },
  taskListContainer: { flex: 1, padding: 16 },
  taskList: { paddingBottom: 20 },
  emptyStateContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyStateText: { fontSize: 14, fontStyle: "italic" },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 8,
  },
});