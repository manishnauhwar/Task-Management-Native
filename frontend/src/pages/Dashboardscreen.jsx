import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, Platform } from 'react-native';
import Charts from '../components/Dashboard/Charts';
import TaskTable from '../components/Dashboard/TaskTable';
import { useTheme } from '../utils/ThemeContext';

const Dashboardscreen = () => {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
      />
      <Text style={[styles.heading, { color: theme.text }]}>Dashboard</Text>
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          nestedScrollEnabled={true}
        >
          <View style={styles.chartsSection}>
            <Charts />
          </View>
          <View style={styles.tableSection}>
            <TaskTable />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: 10,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 15,
    textAlign: 'center',
  },
  chartsSection: {
    marginBottom: 20,
  },
  tableSection: {
    height: 400,
    marginBottom: 20,
  },
});

export default Dashboardscreen;
