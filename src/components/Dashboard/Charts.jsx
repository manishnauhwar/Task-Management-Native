import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { Card, ActivityIndicator, Title, useTheme as usePaperTheme } from 'react-native-paper';
import axiosInstance from '../../utils/axiosinstance';
import { useTheme } from '../../utils/ThemeContext';
import { getCurrentUser } from '../../utils/authService';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth * 0.7;

const Charts = () => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Error loading user:', error);
      setError('Failed to load user information');
      return null;
    }
  };

  const fetchData = async () => {
    try {
      const currentUser = await loadUser();
      if (!currentUser) {
        return;
      }
      const tasksResponse = await axiosInstance.get('/tasks');

      if (currentUser.role === 'admin') {
        setTasks(tasksResponse.data);
        generateMonthlyStats(tasksResponse.data);
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
          generateMonthlyStats(managerTasks);
        } catch (error) {
          console.error('Error fetching teams:', error);
          const managerTasks = tasksResponse.data.filter(
            task => task.userId === currentUser.id || task.assignedTo === currentUser.id
          );
          setTasks(managerTasks);
          generateMonthlyStats(managerTasks);
        }
      } else {
        const userTasks = tasksResponse.data.filter(
          task => task.userId === currentUser.id || task.assignedTo === currentUser.id
        );
        setTasks(userTasks);
        generateMonthlyStats(userTasks);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load tasks');
    }
  };

  const generateMonthlyStats = (taskData) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month < 0) {
        month = 12 + month;
        year--;
      }
      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
      const completedTasksInMonth = taskData.filter(task => {
        if (!task.completedDate || task.status?.toLowerCase() !== 'completed') return false;
        try {
          const completedDate = new Date(task.completedDate);
          return completedDate.getMonth() === month && completedDate.getFullYear() === year;
        } catch (error) {
          return false;
        }
      }).length;
      const totalTasksInMonth = taskData.filter(task => {
        if (!task.createdAt) return false;
        try {
          const createdDate = new Date(task.createdAt);
          return createdDate.getMonth() === month && createdDate.getFullYear() === year;
        } catch (error) {
          return false;
        }
      }).length;
      monthlyData.push({
        month: monthName,
        year: year,
        completedTasks: completedTasksInMonth,
        totalTasks: totalTasksInMonth
      });
    }
    setMonthlyStats(monthlyData);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const completedTasks = tasks?.filter(task => task.status?.toLowerCase() === 'completed').length || 0;
  const pendingTasks = tasks?.filter(task =>
    task.status?.toLowerCase() === 'to do' ||
    task.status?.toLowerCase() === 'in progress'
  ).length || 0;

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

  const highPriorityTasks = tasks?.filter(task => task.priority?.toLowerCase() === 'high').length || 0;
  const mediumPriorityTasks = tasks?.filter(task => task.priority?.toLowerCase() === 'medium').length || 0;
  const lowPriorityTasks = tasks?.filter(task => task.priority?.toLowerCase() === 'low').length || 0;

  const statusColors = {
    completed: '#4ade80',
    pending: '#facc15',
    overdue: '#f87171',
  };

  const priorityColors = {
    high: '#ef4444',
    medium: '#fb923c',
    low: '#60a5fa',
  };

  const chartData = [
    { name: t('charts.legend.completed'), population: completedTasks, color: statusColors.completed, legendFontColor: theme.text, legendFontSize: 10, key: 'completed-segment' },
    { name: t('charts.legend.pending', 'Pending'), population: pendingTasks, color: statusColors.pending, legendFontColor: theme.text, legendFontSize: 10, key: 'pending-segment' },
    { name: t('charts.legend.overdue', 'Overdue'), population: overdueTasks, color: statusColors.overdue, legendFontColor: theme.text, legendFontSize: 10, key: 'overdue-segment' }
  ];

  const priorityData = [
    { name: t('charts.legend.high', 'High'), population: highPriorityTasks, color: priorityColors.high, legendFontColor: theme.text, legendFontSize: 10, key: 'high-priority-segment' },
    { name: t('charts.legend.medium', 'Medium'), population: mediumPriorityTasks, color: priorityColors.medium, legendFontColor: theme.text, legendFontSize: 10, key: 'medium-priority-segment' },
    { name: t('charts.legend.low', 'Low'), population: lowPriorityTasks, color: priorityColors.low, legendFontColor: theme.text, legendFontSize: 10, key: 'low-priority-segment' }
  ];

  const lineChartData = {
    labels: monthlyStats.map(stat => stat.month),
    datasets: [
      { data: monthlyStats.map(stat => stat.completedTasks), color: () => statusColors.completed, strokeWidth: 2 },
      { data: monthlyStats.map(stat => stat.totalTasks), color: () => '#8b5cf6', strokeWidth: 2 }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: theme.cardBackground,
    backgroundGradientTo: theme.cardBackground,
    color: (opacity = 1) => `rgba(${theme.text === '#ffffff' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.text === '#ffffff' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    decimalPlaces: 0,
    fillShadowGradient: paperTheme.colors.primary,
    fillShadowGradientOpacity: 0.2,
    propsForDots: { r: '3', strokeWidth: '1', stroke: paperTheme.colors.primary }
  };

  const getChartTitle = () => {
    if (user?.role === 'admin') {
      return t('charts.allTasksAnalytics');
    } else if (user?.role === 'manager') {
      return t('charts.teamTasksAnalytics');
    } else {
      return t('charts.myTasksAnalytics');
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Title style={[styles.sectionTitle, { color: theme.text }]}>{getChartTitle()}</Title>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        <Card style={[styles.chartCard, { backgroundColor: theme.cardBackground }]} elevation={3}>
          <Card.Content style={styles.chartContent}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>{t('charts.statusDistribution')}</Text>
            <PieChart
              data={chartData}
              width={chartWidth}
              height={150}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              hasLegend={true}
              center={[10, 0]}
              absolute
            />
          </Card.Content>
        </Card>

        <Card style={[styles.chartCard, { backgroundColor: theme.cardBackground }]} elevation={3}>
          <Card.Content style={styles.chartContent}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>{t('charts.priorityDistribution')}</Text>
            <PieChart
              data={priorityData}
              width={chartWidth}
              height={150}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              hasLegend={true}
              center={[10, 0]}
              absolute
            />
          </Card.Content>
        </Card>

        <Card style={[styles.chartCard, { backgroundColor: theme.cardBackground }]} elevation={3}>
          <Card.Content style={styles.chartContent}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>{t('charts.monthlyTaskCompletion')}</Text>
            <LineChart
              data={lineChartData}
              width={chartWidth}
              height={150}
              chartConfig={chartConfig}
              bezier
              style={styles.lineChart}
              withInnerLines={false}
              withOuterLines={false}
              withShadow={false}
              withDots={true}
              formatYLabel={(value) => Math.round(value)}
            />
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: statusColors.completed }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>{t('charts.legend.completed')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#8b5cf6' }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>{t('charts.legend.total')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  horizontalScrollContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom:20
  },
  chartCard: {
    width: chartWidth + 20,
    marginRight: 15,
  },
  chartContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  lineChart: {
    borderRadius: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  legendColor: {
    width: 10,
    height: 10,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Charts;
