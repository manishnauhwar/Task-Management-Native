import { StyleSheet, Text, View, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { PieChart, LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { useTheme } from '../../utils/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const Charts = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [prevstat, setPrevstat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get('https://67dd0778e00db03c4069dbf8.mockapi.io/tasks');
        setTasks(res.data || []);
      } catch (error) {
        setTasks([]);
      }
    };

    const fetchPrevTasks = async () => {
      try {
        const res = await axios.get('https://67dd2525e00db03c406a5c23.mockapi.io/taskStatistics');
        setPrevstat(res.data || []);
      } catch (error) {
        setPrevstat([]);
      }
      setLoading(false);
    };

    fetchTasks();
    fetchPrevTasks();
  }, []);

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(task => task.status?.toLowerCase() === 'completed').length || 0;
  const overdueTasks = tasks?.filter(task => task.status?.toLowerCase() === 'overdue').length || 0;
  const pendingTasks = Math.max(totalTasks - (completedTasks + overdueTasks), 0);
  const today = new Date().toISOString().split('T')[0];
  const tasksDueToday = tasks?.filter(task => {
    if (!task.dueDate) return false;
    try {
      return new Date(task.dueDate).toISOString().split('T')[0] === today;
    } catch (error) {
      console.log('Invalid date for task:', task.id);
      return false;
    }
  }).length || 0;

  const chartData = [
    { name: 'Completed', population: completedTasks, color: '#4CAF50', legendFontColor: theme.text, legendFontSize: 12 },
    { name: 'Pending', population: pendingTasks, color: '#FFC107', legendFontColor: theme.text, legendFontSize: 12 },
    { name: 'Overdue', population: overdueTasks, color: '#F44336', legendFontColor: theme.text, legendFontSize: 12 }
  ];

  const lineChartData = {
    labels: prevstat.map(stat => stat.year.toString()),
    datasets: [
      { data: prevstat.map(stat => stat.completedTasks), color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, strokeWidth: 2 },
      { data: prevstat.map(stat => stat.totalTasks), color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, strokeWidth: 2 }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.background,
    color: () => theme.text,
    labelColor: () => theme.text,
    decimalPlaces: 0,
    fillShadowGradient: '#ffa726',
    fillShadowGradientOpacity: 0.2,
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffa726' }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.mainContainer}>
      <View style={styles.cardContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Total Tasks</Text>
          <Text style={[styles.cardNumber, { color: theme.text }]}>{totalTasks}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Due Today</Text>
          <Text style={[styles.cardNumber, { color: theme.text }]}>{tasksDueToday}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Completed</Text>
          <Text style={[styles.cardNumber, { color: theme.text }]}>{completedTasks}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Overdue</Text>
          <Text style={[styles.cardNumber, { color: theme.text }]}>{overdueTasks}</Text>
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.subHeading, { color: theme.text }]}>Task Distribution</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="20"
          absolute
        />
      </View>

      {prevstat.length > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.subHeading, { color: theme.text }]}>Task Completion Over the Years</Text>
          <LineChart
            data={lineChartData}
            width={screenWidth - 70}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.lineChartStyle}
            withInnerLines
            withOuterLines={false}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default Charts;

const styles = StyleSheet.create({
  mainContainer: { flexGrow: 1, padding: 20 },
  subHeading: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  cardContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '47%', borderRadius: 10, paddingVertical: 15, paddingHorizontal: 10, marginBottom: 15, alignItems: 'center', shadowColor: '#ccc', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardNumber: { fontSize: 20, fontWeight: '700', marginTop: 5 },
  chartContainer: { width: '100%', borderRadius: 15, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4, alignItems: 'center' },
  lineChartStyle: { marginVertical: 8, borderRadius: 10 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
