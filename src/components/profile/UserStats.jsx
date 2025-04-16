import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format, formatDistanceToNow } from 'date-fns';

const UserStats = ({ tasks, theme }) => {
  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const pendingTasks = tasks.filter(task => task.status === 'To Do' || task.status === 'In progress');
  const completedTaskCount = completedTasks.length;
  const pendingTaskCount = pendingTasks.length;
  
  let avgCompletionTime = 0;
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.completedAt && task.createdAt) {
        const start = new Date(task.createdAt);
        const end = new Date(task.completedAt);
        return sum + (end - start);
      }
      return sum;
    }, 0);

    avgCompletionTime = (totalTime / completedTasks.length) / (1000 * 60 * 60);
  }

  const formatTime = (hours) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10} hours`;
    } else {
      return `${Math.round(hours / 24 * 10) / 10} days`;
    }
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Task Statistics</Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{tasks.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>Total Tasks</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.success }]}>{completedTaskCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.warning }]}>{pendingTaskCount}</Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>Pending</Text>
          </View>
        </View>
        <View style={[styles.averageTimeCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.averageTimeLabel, { color: theme.text }]}>Average Completion Time:</Text>
          <Text style={[styles.averageTimeValue, { color: theme.primary }]}>
            {completedTaskCount > 0 ? formatTime(avgCompletionTime) : 'N/A'}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  averageTimeCard: {
    borderRadius: 5,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageTimeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  averageTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default UserStats;