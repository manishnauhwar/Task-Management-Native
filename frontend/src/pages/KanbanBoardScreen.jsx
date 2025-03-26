import React, { useEffect, useState, useRef } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View, ActivityIndicator, Platform, PanResponder, Animated, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import axios from "axios";
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const API_URL = "https://67dd0778e00db03c4069dbf8.mockapi.io/tasks";
const columns = [
  { title: "To Do", status: "pending" || "overdue" },
  { title: "In Progress", status: "in-progress" },
  { title: "Completed", status: "Completed" },
];

const getColumnIndex = (status) => {
  return columns.findIndex((col) => col.status === status);
};

const CalendarIcon = ({ onPress, color }) => (
  <TouchableOpacity onPress={onPress}>
    <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 8h18M8 3v2m8-2v2m-8 4v8m4-8v8m4-8v8M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
    </Svg>
  </TouchableOpacity>
);

const KanbanBoardScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const positions = useRef({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${API_URL}/${taskId}`, { status: newStatus });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const createPanResponder = (task) => {
    if (!positions.current[task.id]) {
      positions.current[task.id] = new Animated.ValueXY();
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggingTaskId(task.id);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: positions.current[task.id].x, dy: positions.current[task.id].y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        const threshold = 50;
        const currentIndex = getColumnIndex(task.status);
        let newIndex = currentIndex;
        if (gestureState.dx > threshold && currentIndex < columns.length - 1) {
          newIndex = currentIndex + 1;
        } else if (gestureState.dx < -threshold && currentIndex > 0) {
          newIndex = currentIndex - 1;
        }
        const newStatus = columns[newIndex].status;
        updateTaskStatus(task.id, newStatus);
        Animated.spring(positions.current[task.id], { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        setDraggingTaskId(null);
      }
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.statusBarStyle}
      />
      <View style={styles.header}>
        <CalendarIcon onPress={() => navigation.navigate('Calendar')} color={theme.text} />
        <Text style={[styles.heading, { color: theme.text }]}>Kanban Board</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <ScrollView horizontal contentContainerStyle={styles.boardContainer}>
          {columns.map((col) => (
            <View key={col.status} style={[styles.column, {
              backgroundColor: theme.cardBackground,
              borderTopColor: theme.primary
            }]}>
              <View style={[styles.columnHeader, { backgroundColor: theme.taskHeaderBg }]}>
                <Text style={[styles.columnTitle, { color: theme.cardHeaderText }]}>
                  {col.title}
                </Text>
              </View>
              {tasks.filter((task) => task.status === col.status).map((task) => {
                const panResponder = createPanResponder(task);
                const isDragging = draggingTaskId === task.id;
                return (
                  <Animated.View
                    key={task.id}
                    style={[
                      styles.task,
                      {
                        backgroundColor: theme.taskCardBg,
                        borderLeftColor: theme.primary,
                      },
                      isDragging && styles.draggingTask,
                      { transform: positions.current[task.id].getTranslateTransform() }
                    ]}
                    {...panResponder.panHandlers}
                  >
                    <Text style={{ color: theme.text }}>{task.title}</Text>
                    <Text style={[styles.taskPriority, { color: theme.textSecondary }]}>
                      Priority: {task.priority}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default KanbanBoardScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  boardContainer: {
    paddingTop: 10,
  },
  column: {
    width: 126,
    margin: 5,
    padding: 10,
    borderRadius: 10,
    borderTopWidth: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 8,
    color: "#9fd3c7",
  },
  task: {
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderLeftWidth: 2,
  },
  draggingTask: {
    zIndex: 1000,
    elevation: 1000,
  },
  taskPriority: {
    fontSize: 14,
    color: "black",
    marginTop: 5
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    marginVertical: 15,
    textAlign: "center",
    marginLeft: 10
  },
});
