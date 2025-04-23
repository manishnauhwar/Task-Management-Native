import React, { useCallback } from 'react';
import { View, StatusBar, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Charts from '../components/Dashboard/Charts';
import TaskCards from '../components/Dashboard/TaskCards';
import { useTheme } from '../utils/ThemeContext';
import { StyleSheet } from 'react-native';
import { useNavigationBar } from '../../App';

const Dashboardscreen = () => {
  const { theme } = useTheme();
  const { isGestureNavigationEnabled, bottomInset } = useNavigationBar();

  const getExtraBottomPadding = () => {
    const tabBarHeight = 60;
    
    const totalBottomPadding = tabBarHeight + (isGestureNavigationEnabled ? bottomInset : 0);
    
    return totalBottomPadding;
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     console.log("Dashboard focused: refresh data here");
  //     return () => {
  //       console.log("Dashboard unfocused");
  //     };
  //   }, [])
  // );

  return (
    <SafeAreaView 
      style={[
        styles.safeArea, 
        { backgroundColor: theme.background }
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
      />
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: getExtraBottomPadding() }
          ]}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsSection}>
            <TaskCards />
          </View>
          <View style={styles.chartsSection}>
            <Charts />
          </View>
          {/* <View style={styles.tableSection}>
            <TaskTable />
          </View> */}
        </ScrollView>
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
    paddingTop: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 15,
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
  cardsSection: {
    marginBottom: 20,
  },
  // tableSection: {
  //   height: 400,
  //   marginBottom: 20,
  // },
});

export default Dashboardscreen;

