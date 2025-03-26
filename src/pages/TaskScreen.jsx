import React, { useState } from 'react';
import { Text, View, StyleSheet, StatusBar, Platform } from 'react-native';
import SortFilterBar from '../components/Tasks/SortFilterBar';
import TaskTable from '../components/Dashboard/TaskTable';
import { useTheme } from '../utils/ThemeContext';

const TaskScreen = () => {
  const { theme } = useTheme();
  const [sortField, setSortField] = useState("Sort by");
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
      />
      <Text style={[styles.heading, { color: theme.text }]}>Task Overview</Text>

      <View style={styles.contentContainer}>
        <View style={styles.filterSection}>
          <SortFilterBar
            sortField={sortField}
            setSortField={setSortField}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
          />
        </View>

        <View style={styles.tableSection}>
          <TaskTable
            sortField={sortField}
            sortOrder={sortOrder}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 15,
    textAlign: 'center'
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10
  },
  filterSection: {
    zIndex: 2 
  },
  tableSection: {
    flex: 1,
    zIndex: 1 
  }
});

export default TaskScreen;
