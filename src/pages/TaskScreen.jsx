import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import SortFilterBar from '../components/Tasks/SortFilterBar';
import TaskTable from '../components/Tasks/TaskTable';
import { useTheme } from '../utils/ThemeContext';
import { useNavigationBar } from '../../App';

const TaskScreen = () => {
  const { theme } = useTheme();
  const { isGestureNavigationEnabled, bottomInset } = useNavigationBar();
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getBottomSpacing = () => {
    const tabBarHeight = 60;
    return tabBarHeight + (isGestureNavigationEnabled ? bottomInset : 0);
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     console.log("TaskScreen focused: refresh TaskTable data here");
  //     return () => {
  //       console.log("TaskScreen unfocused");
  //     };
  //   }, [])
  // );

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
      />
      <View style={[
        styles.contentContainer, 
        { paddingBottom: getBottomSpacing() }
      ]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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