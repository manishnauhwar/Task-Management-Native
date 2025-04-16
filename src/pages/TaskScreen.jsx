import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import SortFilterBar from '../components/Tasks/SortFilterBar';
import TaskTable from '../components/Dashboard/TaskTable';
import { useTheme } from '../utils/ThemeContext';

const TaskScreen = () => {
  const { theme } = useTheme();
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      console.log("TaskScreen focused: refresh TaskTable data here");
      return () => {
        console.log("TaskScreen unfocused");
      };
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          backgroundColor={theme.background}
          barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
        />
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </View>
          <View style={styles.tableSection}>
            <TaskTable
              sortField={sortField}
              sortOrder={sortOrder}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              searchQuery={searchQuery}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  filterSection: {
    marginBottom: 10,
  },
  tableSection: {
    flex: 1,
  }
});

export default TaskScreen;
