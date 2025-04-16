import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const UserStats = ({ tasks, theme }) => {
  const completedTasks = tasks?.filter(task => task.status?.toLowerCase() === 'completed') || [];
  const pendingTasks = tasks?.filter(task => 
    task.status?.toLowerCase() === 'to do' || 
    task.status?.toLowerCase() === 'in progress'
  ) || [];
  const completedTaskCount = completedTasks.length;
  const pendingTaskCount = pendingTasks.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks?.filter(task => {
    if (!task.dueDate) return false;
    try {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && task.status?.toLowerCase() !== 'completed';
    } catch (error) {
      console.log('Invalid date for task:', task.id);
      return false;
    }
  }).length || 0;

  const highPriorityTasks = tasks?.filter(task => 
    task.priority?.toLowerCase() === 'high'
  ).length || 0;

  const calculateAverageUpdateTime = () => {
    if (!tasks || tasks.length === 0) return "N/A";
    
    let totalMinutes = 0;
    let validTaskCount = 0;
    
    tasks.forEach(task => {
      if (task.createdAt && task.updatedAt) {
        const createdDate = new Date(task.createdAt);
        const updatedDate = new Date(task.updatedAt);
        
        if (updatedDate > createdDate) {
          const diffMs = updatedDate - createdDate;
          const diffMinutes = diffMs / (1000 * 60);
          totalMinutes += diffMinutes;
          validTaskCount++;
        }
      }
    });
    
    if (validTaskCount === 0) return "N/A";
    
    const avgMinutes = Math.round(totalMinutes / validTaskCount);
    
    if (avgMinutes < 60) {
      return `${avgMinutes} mins`;
    } else {
      const hours = Math.floor(avgMinutes / 60);
      const mins = avgMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  const averageUpdateTime = calculateAverageUpdateTime();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>Task Statistics</Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{tasks?.length || 0}</Text>
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
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, flex: 1 }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{averageUpdateTime}</Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>Avg. Update Time</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  contentCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default UserStats;