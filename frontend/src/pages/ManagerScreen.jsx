import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, SectionList, Animated, PanResponder } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';

const TASKS_API = "https://67dd0778e00db03c4069dbf8.mockapi.io/tasks";
const TEAMS_API = "https://67dd2525e00db03c406a5c23.mockapi.io/teams";
const LOGGED_IN_MANAGER_ID = "M2";

const DraggableTask = ({ task, memberRanges, assignTaskToMember, sectionListRef }) => {
  const { theme } = useTheme();
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const taskRef = useRef(null);
  const memberRangesRef = useRef(memberRanges);

  useEffect(() => {
    memberRangesRef.current = memberRanges;
  }, [memberRanges]);

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
          

         
          let assignedMember = null;
          const currentRanges = memberRangesRef.current;

          if (Object.keys(currentRanges).length > 0) {
            Object.entries(currentRanges).forEach(([memberId, range]) => {
             

              if (dropY >= range.start && dropY <= range.end) {
                assignedMember = memberId;
               
              }
            });
          } 

          if (assignedMember) {
            assignTaskToMember(task.id, assignedMember);
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
        <Text style={[styles.taskTitle, { color: theme.buttonText, width: '100%' }]}>{task.title}</Text>
      </Animated.View>
    </View>
  );
};

const ManagerScreen = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [memberRanges, setMemberRanges] = useState({});
  const teamMemberLayoutsRef = useRef({});
  const sectionListRef = useRef(null);
  const memberRefs = useRef({});
  const managerInfoHeightRef = useRef(0);
  const tasksSectionHeightRef = useRef(0);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, []);

 
  useEffect(() => {
    if (team) {
      setTimeout(updateMemberRanges, 100);
    }
  }, [team]);

  const calculateMemberRanges = (layouts) => {
    const ranges = {};
    const PADDING = 20;

  
    const sortedMembers = Object.entries(layouts).sort((a, b) => {
      return a[1].pageY - b[1].pageY;
    });

    sortedMembers.forEach(([memberId, layout]) => {
      
      const absoluteY = layout.pageY;
      ranges[memberId] = {
        start: absoluteY - PADDING,
        end: absoluteY + layout.height + PADDING,
        pageY: absoluteY,
        height: layout.height,
        center: absoluteY + (layout.height / 2)
      };
    });

    return ranges;
  };

  const updateMemberRanges = () => {

    Object.entries(memberRefs.current).forEach(([memberId, ref]) => {
      if (ref) {
        ref.measure((x, y, width, height, pageX, pageY) => {
         

          teamMemberLayoutsRef.current = {
            ...teamMemberLayoutsRef.current,
            [memberId]: {
              width,
              height,
              pageX,
              pageY,
              absoluteY: pageY
            }
          };

          
          const ranges = calculateMemberRanges(teamMemberLayoutsRef.current);
          setMemberRanges(ranges);
      
        });
      }
    });
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(TASKS_API);
      const data = await response.json();
      const filteredTasks = data.filter(task => task.assignedTo === LOGGED_IN_MANAGER_ID);
      setTasks(filteredTasks);
      setTimeout(updateMemberRanges, 100);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(TEAMS_API);
      const data = await response.json();
      const managerTeam = data.find(t => t.manager.id === LOGGED_IN_MANAGER_ID);
      setTeam(managerTeam);
    } catch (error) {
      console.error(error);
    }
  };

  const assignTaskToMember = async (taskId, memberId) => {
    try {
      
      const response = await fetch(`${TASKS_API}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: memberId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign task');
      }

      const updatedTask = await response.json();

     
      const assignedMember = team.members.find(member => member.id === memberId);

      
      addNotification({
        title: 'Task Assigned to Team Member',
        message: `Task "${updatedTask.title}" has been assigned to ${assignedMember.name}`,
      });

    
      await fetchTasks();
      setTimeout(updateMemberRanges, 100);
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const renderTaskItem = ({ item }) => {
  
    return (
      <DraggableTask
        task={item}
        memberRanges={memberRanges}
        assignTaskToMember={assignTaskToMember}
        sectionListRef={sectionListRef}
      />
    );
  };

  const renderTeamMember = ({ item }) => (
    <View
      key={item.id}
      ref={ref => memberRefs.current[item.id] = ref}
      style={[styles.memberCard, {
        backgroundColor: theme.cardBackground,
        shadowColor: theme.shadowColor,
      }]}
      onLayout={(event) => {
        const { layout } = event.nativeEvent;
       

     
        teamMemberLayoutsRef.current = {
          ...teamMemberLayoutsRef.current,
          [item.id]: {
            width: layout.width,
            height: layout.height,
            pageX: layout.x,
            pageY: layout.y
          }
        };

      
        const ranges = calculateMemberRanges(teamMemberLayoutsRef.current);
        setMemberRanges(ranges);
        
      }}
    >
      <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.memberId, { color: theme.textSecondary }]}>ID: {item.id}</Text>
    </View>
  );

  const sections = [
    { title: "Tasks to be Assigned", data: tasks },
    { title: team ? team.name : "Team Members", data: team ? team.members : [] }
  ];

  const renderSectionHeader = ({ section: { title } }) => (
    <View
      onLayout={(event) => {
        if (title === "Tasks to be Assigned") {
          const { height } = event.nativeEvent.layout;
          tasksSectionHeightRef.current = height;
         
        }
      }}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
    <StatusBar
      backgroundColor={theme.background}
      barStyle={theme.text === '#ffffff' ? "light-content" : "dark-content"}
    />
      <Text style={[styles.heading, { color: theme.text }]}>Manager Board</Text>
      <View style={styles.mainContainer}>
        {team && (
          <View style={[styles.managerInfo, {
            backgroundColor: theme.cardBackground,
            borderLeftWidth: 4,
            borderLeftColor: theme.primary,
          }]}>
            <Text style={[styles.managerName, { color: theme.text }]}>
              {team.manager.name}
            </Text>
            <Text style={[styles.managerEmail, { color: theme.textSecondary }]}>
              {team.manager.email}
            </Text>
          </View>
        )}
        <View style={styles.tasksContainer}>
          <SectionList
            ref={sectionListRef}
            sections={[{ title: "Tasks to be Assigned", data: tasks }]}
            keyExtractor={(item, index) => item.id ? item.id : index.toString()}
            renderItem={renderTaskItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.sectionListContent}
           
          />
        </View>
        <View style={styles.membersContainer}>
          <SectionList
            sections={[{ title: team ? team.name : "Team Members", data: team ? team.members : [] }]}
            keyExtractor={(item, index) => item.id ? item.id : index.toString()}
            renderItem={renderTeamMember}
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
      High: "#8B0000", 
      Medium: "#B8860B", 
      Low: "#006400",
  },
  }
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
  safeArea: { flex: 1 ,
    marginTop: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 15,
    textAlign: 'center'
  },
  sectionListContent: { 
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  managerInfo: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
  managerName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  managerEmail: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  taskWrapper: {
    position: 'relative',
    width: '100%',
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
    width: '100%',
  },
  memberCard: {
    padding: 10,
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
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  memberId: {
    fontSize: 14,
  },
  tasksContainer: {
    height: '30%',
    maxHeight: '30%',
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1,
    width: '100%',
    marginBottom: 20,
  },
  membersContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    position: 'relative',
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    top: 0,
    left: 0,
  }
});

export default ManagerScreen;


