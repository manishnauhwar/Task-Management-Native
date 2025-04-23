import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const UserStats = ({ tasks, theme }) => {
  const { t } = useTranslation();

  const completedTasks = tasks?.filter(t => t.status?.toLowerCase() === 'completed') || [];
  const pendingTasks   = tasks?.filter(t =>
    ['to do','in progress'].includes(t.status?.toLowerCase())
  ) || [];

  const completedTaskCount = completedTasks.length;
  const pendingTaskCount   = pendingTasks.length;

  const today = new Date();
  today.setHours(0,0,0,0);

  const overdueCount = tasks?.filter(task => {
    if (!task.dueDate) return false;
    const d = new Date(task.dueDate);
    d.setHours(0,0,0,0);
    return d < today && task.status?.toLowerCase() !== 'completed';
  }).length || 0;

  const calculateAverageUpdateTime = () => {
    if (!tasks?.length) return 'N/A';
    let total = 0, count = 0;
    tasks.forEach(({ createdAt, updatedAt }) => {
      if (createdAt && updatedAt) {
        const diffMin = (new Date(updatedAt) - new Date(createdAt)) / 60000;
        if (diffMin > 0) { total += diffMin; count++; }
      }
    });
    if (!count) return 'N/A';
    const avg = Math.round(total/count);
    return avg < 60
      ? `${avg} mins`
      : `${Math.floor(avg/60)}h${avg%60 ? ` ${avg%60}m` : ''}`;
  };
  const averageUpdateTime = calculateAverageUpdateTime();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop:20 }]}>
        {t('userStats.taskStatistics')}
      </Text>
      <View style={[styles.contentCard, {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
      }]}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {tasks?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              {t('userStats.totalTasks')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {completedTaskCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              {t('userStats.completed')}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.warning }]}>
              {pendingTaskCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              {t('userStats.pending')}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex:1, backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {averageUpdateTime}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text }]}>
              {t('userStats.avgUpdateTime')}
            </Text>
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