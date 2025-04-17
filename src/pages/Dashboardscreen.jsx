import React, { useCallback } from 'react';
import { View, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Charts from '../components/Dashboard/Charts';
import TaskCards from '../components/Dashboard/TaskCards';
import { useTheme } from '../utils/ThemeContext';
import { StyleSheet } from 'react-native';

const Dashboardscreen = () => {
  const { theme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      console.log("Dashboard focused: refresh data here");
      return () => {
        console.log("Dashboard unfocused");
      };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
      />
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
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

// import React from 'react';
// import { SafeAreaView, ScrollView, View, Text, StatusBar } from 'react-native';
// import Charts from '../components/Dashboard/Charts';
// import TaskTable from '../components/Dashboard/TaskTable';
// import { useTheme } from '../utils/ThemeContext';

// const Dashboardscreen = () => {
//   const { theme } = useTheme();

//   return (
//     <SafeAreaView
//       className="flex-1"
//       style={{ backgroundColor: theme.background }}
//     >
//       <StatusBar
//         backgroundColor={theme.background}
//         barStyle={theme.text === '#ffffff' ? 'light-content' : 'dark-content'}
//       />
//       <ScrollView
//         nestedScrollEnabled={true}
//         contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 10 }}
//         className="flex-grow"
//       >
//         <View className="mb-5">
//           <Charts />
//         </View>
//         <View className="mb-5" style={{ height: 400 }}>
//           <TaskTable />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default Dashboardscreen;
