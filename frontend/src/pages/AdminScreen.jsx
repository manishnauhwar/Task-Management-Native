import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, SectionList, Animated, PanResponder, Platform } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';

const TASKS_API = "https://67dd0778e00db03c4069dbf8.mockapi.io/tasks";
const TEAMS_API = "https://67dd2525e00db03c406a5c23.mockapi.io/teams";

const ADMIN_INFO = {
  name: "Ajeet Narvar",
  email: "ajeet@example.com"
};

const DraggableTask = ({ task, teamRanges, assignTaskToTeam, sectionListRef }) => {
  const { theme } = useTheme();
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const taskRef = useRef(null);
  const teamRangesRef = useRef(teamRanges);

  useEffect(() => {
    teamRangesRef.current = teamRanges;
  }, [teamRanges]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        setDragging(false);
        let scrollPosition = 0;
        try {
          const scrollResponder = sectionListRef.current?.getScrollResponder();
          if (scrollResponder) {
            const scrollableNode = scrollResponder.getScrollableNode();
            if (scrollableNode) {
              scrollPosition = scrollableNode.scrollTop || 0;
            }
          }
        } catch (error) {
          console.log('Error getting scroll position:', error);
        }

        taskRef.current.measure((x, y, width, height, pageX, pageY) => {
          const dropY = gestureState.moveY + scrollPosition;


          let assignedTeam = null;
          const currentRanges = teamRangesRef.current;
          if (Object.keys(currentRanges).length > 0) {
            Object.entries(currentRanges).forEach(([teamId, range]) => {

              if (dropY >= range.start && dropY <= range.end) {
                assignedTeam = teamId;

              }
            });
          }
          if (assignedTeam) {

            assignTaskToTeam(task.id, assignedTeam);
          }
        });

        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    })
  ).current;

  return (
    <View style={styles.taskWrapper}>
      <Animated.View
        ref={taskRef}
        style={[
          styles.taskCard,
          getPriorityStyle(task.priority),
          dragging && styles.draggedTask,
          pan.getLayout(),
          { width: '100%' }
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={[styles.taskTitle, { color: theme.buttonText, width: '100%' }]}>
          {task.title}
        </Text>
      </Animated.View>
    </View>
  );
};

const AdminScreen = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamRanges, setTeamRanges] = useState({});
  const teamLayoutsRef = useRef({});
  const sectionListRef = useRef(null);
  const teamRefs = useRef({});
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, []);

  useEffect(() => {
    if (teams.length > 0) {
      setTimeout(updateTeamRanges, 100);
    }
  }, [teams]);

  const calculateTeamRanges = (layouts) => {
    const ranges = {};
    const PADDING = 20;
    const sortedTeams = Object.entries(layouts).sort((a, b) => a[1].pageY - b[1].pageY);
    sortedTeams.forEach(([teamId, layout]) => {
      const absoluteY = layout.pageY;
      ranges[teamId] = {
        start: absoluteY - PADDING,
        end: absoluteY + layout.height + PADDING,
        pageY: absoluteY,
        height: layout.height,
        center: absoluteY + (layout.height / 2)
      };
    });

    return ranges;
  };

  const updateTeamRanges = () => {
    Object.entries(teamRefs.current).forEach(([teamId, ref]) => {
      if (ref) {
        ref.measure((x, y, width, height, pageX, pageY) => {

          teamLayoutsRef.current = {
            ...teamLayoutsRef.current,
            [teamId]: { width, height, pageX, pageY, absoluteY: pageY }
          };
          const ranges = calculateTeamRanges(teamLayoutsRef.current);
          setTeamRanges(ranges);

        });
      }
    });
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(TASKS_API);
      const data = await response.json();
      const unassignedTasks = data.filter(task => !task.assignedTo);
      setTasks(unassignedTasks);
      setTimeout(updateTeamRanges, 100);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(TEAMS_API);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error(error);
    }
  };

  const assignTaskToTeam = async (taskId, teamId) => {
    try {

      const response = await fetch(`${TASKS_API}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: teamId })
      });

      if (!response.ok) throw new Error('Failed to assign task');
      const updatedTask = await response.json();


      const assignedTeam = teams.find(team => team.id === teamId);


      addNotification({
        title: 'Task Assigned to Team',
        message: `Task "${updatedTask.title}" has been assigned to team ${assignedTeam.name} (${teamId}) by Admin`,
      });


      await fetchTasks();
      setTimeout(updateTeamRanges, 100);
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const renderTaskItem = ({ item }) => {

    return (
      <DraggableTask
        task={item}
        teamRanges={teamRanges}
        assignTaskToTeam={assignTaskToTeam}
        sectionListRef={sectionListRef}
      />
    );
  };

  const renderTeamItem = ({ item }) => (
    <View
      key={item.id}
      ref={ref => teamRefs.current[item.id] = ref}
      style={[styles.teamCard, {
        backgroundColor: theme.cardBackground,
        shadowColor: theme.shadowColor,
      }]}
      onLayout={(event) => {
        const { layout } = event.nativeEvent;

        teamLayoutsRef.current = {
          ...teamLayoutsRef.current,
          [item.id]: { width: layout.width, height: layout.height, pageX: layout.x, pageY: layout.y }
        };
        const ranges = calculateTeamRanges(teamLayoutsRef.current);
        setTeamRanges(ranges);

      }}
    >
      <Text style={[styles.teamName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.managerName, { color: theme.textSecondary }]}>
        Manager: {item.manager.name}
      </Text>
      <Text style={[styles.managerEmail, { color: theme.textSecondary }]}>
        {item.manager.email}
      </Text>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar backgroundColor={theme.background} barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"} />
      <Text style={[styles.heading, { color: theme.text }]}>Admin Board</Text>
      <View style={[styles.adminInfo, {
        backgroundColor: theme.cardBackground,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
      }]}>
        <Text style={[styles.adminName, { color: theme.text }]}>
          {ADMIN_INFO.name}
        </Text>
        <Text style={[styles.adminEmail, { color: theme.textSecondary }]}>
          {ADMIN_INFO.email}
        </Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.tasksContainer}>
          <SectionList
            ref={sectionListRef}
            sections={[{ title: "Unassigned Tasks", data: tasks }]}
            keyExtractor={(item, index) => item.id ? item.id : index.toString()}
            renderItem={renderTaskItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.sectionListContent}
          />
        </View>
        <View style={styles.teamsContainer}>
          <SectionList
            sections={[{ title: "Teams", data: teams }]}
            keyExtractor={(item, index) => item.id ? item.id : index.toString()}
            renderItem={renderTeamItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.sectionListContent}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const getPriorityStyle = (priority) => {
  const { theme, isDarkMode } = useTheme();

  const priorityColors = {
    light: {
      High: "#ff4d4d",
      Medium: "#ffcc00",
      Low: "#28a745",
    },
    dark: {
      High: "#8B0000", // darker red
      Medium: "#B8860B", // darker yellow
      Low: "#006400", // darker green
    }
  };

  const colors = isDarkMode ? priorityColors.dark : priorityColors.light;

  switch (priority) {
    case "High":
      return { backgroundColor: colors.High };
    case "Medium":
      return { backgroundColor: colors.Medium };
    case "Low":
      return { backgroundColor: colors.Low };
    default:
      return { backgroundColor: theme.cardBackground };
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 15,
    textAlign: 'center'
  },
  sectionListContent: {
    padding: 10,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    marginTop: 10,
  },
  tasksContainer: {
    height: '30%',
    maxHeight: '30%',
    overflow: 'visible',
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 2,
    width: '100%',
    marginBottom: 20,
  },
  teamsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1,
    width: '100%'
  },
  taskWrapper: {
    position: 'relative',
    width: '100%'
  },
  taskCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: "black",
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    width: '100%'
  },
  teamCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  managerName: {
    fontSize: 16,
  },
  managerEmail: {
    fontSize: 14,
  },
  draggedTask: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
    width: '100%',
    backgroundColor: 'black',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    top: 0,
    left: 0
  },

  adminInfo: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  adminName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  adminEmail: {
    fontSize: 16,
  },
});

export default AdminScreen;
