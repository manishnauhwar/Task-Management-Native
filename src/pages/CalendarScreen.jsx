import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const BackArrowIcon = ({ onPress, color }) => (
  <TouchableOpacity onPress={onPress} style={styles.backButton}>
    <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  </TouchableOpacity>
);

const CalendarScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (route.params?.tasks) {
      setTasks(route.params.tasks);
    }
  }, [route.params?.tasks]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const hasTasksOnDate = (date) => {
    return tasks.some(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const hasTasks = hasTasksOnDate(date);
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            hasTasks && { backgroundColor: theme.danger },
            isSelected && { backgroundColor: theme.primary }
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[
            styles.dayText,
            { color: theme.text },
            (hasTasks || isSelected) && { color: theme.buttonText }
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment));
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#2ecc71";
      default:
        return "#95a5a6";
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.statusBarStyle} />
      <View style={styles.header}>
        <BackArrowIcon onPress={() => navigation.goBack()} color={theme.text} />
        <Text style={[styles.heading, { color: theme.text }]}>Calendar</Text>
      </View>

      <View style={styles.calendarContainer}>
        <View style={[styles.calendarWrapper, {
          backgroundColor: theme.cardBackground,
          shadowColor: theme.shadowColor,
        }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <Text style={[styles.navigationButton, { color: theme.text }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <Text style={[styles.navigationButton, { color: theme.text }]}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={[styles.weekDay, { color: theme.textSecondary }]}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendar}>
            {renderCalendar()}
          </View>
        </View>

        {selectedDate && (
          <View style={[styles.tasksContainer, {
            backgroundColor: theme.cardBackground,
            shadowColor: theme.shadowColor,
          }]}>
            <View style={[styles.tasksHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.selectedDateTitle, { color: theme.text }]}>
                Tasks for {selectedDate.toLocaleDateString()}
              </Text>
            </View>
            <ScrollView style={styles.tasksList}>
              {getTasksForDate(selectedDate).length > 0 ? (
                getTasksForDate(selectedDate).map(task => (
                  <View key={task._id} style={[styles.taskItem, {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                    shadowColor: theme.shadowColor,
                  }]}>
                    <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                    <View style={styles.taskInfo}>
                      <View style={[styles.taskPriority, {
                        backgroundColor: getPriorityColor(task.priority),
                      }]}>
                        <Text style={styles.priorityText}>{task.priority || "Normal"}</Text>
                      </View>
                      <Text style={[styles.taskStatus, { color: theme.textSecondary }]}>
                        Status: {task.status}
                      </Text>
                    </View>
                    {task.description && (
                      <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                        {task.description.length > 50 
                          ? task.description.substring(0, 50) + '...' 
                          : task.description}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                    No tasks created on this date
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
    marginRight: 38,
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  calendarWrapper: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  navigationButton: {
    fontSize: 24,
    padding: 10,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
  },
  dayWithTasks: {
    backgroundColor: '#dc3545',
  },
  dayWithTasksText: {
    color: '#ffffff',
  },
  selectedDay: {
    backgroundColor: '#0d6efd',
  },
  selectedDayText: {
    color: '#ffffff',
  },
  tasksContainer: {
    flex: 1,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  tasksHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tasksList: {
    flex: 1,
    padding: 16,
  },
  taskItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskPriority: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});

export default CalendarScreen; 