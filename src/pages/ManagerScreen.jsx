import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../utils/axiosinstance';
import { getCurrentUser } from '../utils/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DraggableTask from '../components/manager/DraggableTask';
import TeamMember from '../components/manager/TeamMember';
import EmptyState from '../components/manager/EmptyState';
import { managerStyles } from '../styles/manager';

const ManagerScreen = () => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  const [highlightedMember, setHighlightedMember] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [assigningTaskId, setAssigningTaskId] = useState(null);

  const memberRefs = useRef({});
  const memberPositions = useRef({});
  const horizontalScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
  const { addNotification } = useNotification();

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);

          if (!user) {
            setIsLoading(false);
            return;
          }

          const userId = getUserId(user);
          if (userId) {
            await Promise.all([
              fetchTasks(userId),
              fetchTeams(userId)
            ]);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          addNotification({
            title: t('common.error'),
            message: t('manager.fetchError'),
            type: 'error',
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  const getUserId = (user) => {
    return (user && (user._id || user.id)) ? (user._id || user.id).toString() : null;
  };

  const fetchTasks = async (userId) => {
    try {
      const response = await axiosInstance.get('/tasks');
      const data = response.data;
      const filteredTasks = data.filter(task => task.assignedTo === userId);
      setTasks(filteredTasks);
      return filteredTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  };

  const fetchTeams = async (userId) => {
    try {
      const response = await axiosInstance.get('/teams');
      const data = response.data;
      const managerTeams = data.filter(
        (t) => t.manager && t.manager._id && t.manager._id.toString() === userId
      );
      
      let aggregatedMembers = [];
      managerTeams.forEach((team) => {
        if (team.members && team.members.length > 0) {
          aggregatedMembers = aggregatedMembers.concat(team.members);
        }
      });
      
      const uniqueMembers = aggregatedMembers.reduce((acc, member) => {
        if (!acc.some(m => m._id.toString() === member._id.toString())) {
          acc.push(member);
        }
        return acc;
      }, []);
      
      setTeamMembers(uniqueMembers);
      return uniqueMembers;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  };

  const updateMemberPosition = (memberId) => (event) => {
    memberRefs.current[memberId]?.measureInWindow((pageX, pageY, width, height) => {
      memberPositions.current[memberId] = { pageX, pageY, width, height };
    });
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setScrollEnabled(false);
    Object.keys(memberRefs.current).forEach(memberId => {
      const ref = memberRefs.current[memberId];
      if (ref) {
        ref.measureInWindow((pageX, pageY, width, height) => {
          memberPositions.current[memberId] = { pageX, pageY, width, height };
        });
      }
    });
  };

  const calculateDropTarget = (gestureState) => {
    const { moveX, moveY } = gestureState;
    let targetMemberId = null;
    let targetMember = null;
    
    Object.entries(memberPositions.current).forEach(([memberId, position]) => {
      const { pageX, pageY, width, height } = position;
      if (
        moveX >= pageX &&
        moveX <= pageX + width &&
        moveY >= pageY &&
        moveY <= pageY + height
      ) {
        targetMemberId = memberId;
        targetMember = teamMembers.find(m =>
          (m._id || m.id).toString() === memberId
        );
      }
    });
    
    if (targetMemberId) {
      setHighlightedMember(targetMemberId);
      setTimeout(() => setHighlightedMember(null), 500);
    }
    
    return { targetMemberId, targetMember };
  };

  const handleDragEnd = async (taskId, dropResult) => {
    setIsDragging(false);
    setScrollEnabled(true);
    const { targetMemberId, targetMember } = dropResult;
    
    if (targetMemberId) {
      try {
        setAssigningTaskId(taskId);
        const response = await axiosInstance.put(`/tasks/${taskId}`, {
          assignedTo: targetMemberId,
        });
        
        if (response.status === 200) {
          const updatedTask = response.data;
          const notificationPayload = {
            type: 'task_assigned',
            title: t('manager.taskAssigned'),
            message: t('manager.taskAssignedMsg', {
              title: updatedTask.title,
              memberName: targetMember ? (targetMember.fullname || targetMember.name) : t('manager.defaultTeamMember'),
            }),
            recipient: targetMemberId,
            sender: getUserId(currentUser),
            timestamp: new Date().toISOString(),
          };

          await axiosInstance.post('/notifications', notificationPayload);
          await fetchTasks(getUserId(currentUser));
          
          addNotification({
            title: t('manager.taskAssigned'),
            message: t('manager.taskAssignedMsg', {
              title: updatedTask.title,
              memberName: targetMember ? (targetMember.fullname || targetMember.name) : t('manager.defaultTeamMember'),
            }),
            type: 'success',
          });
        } else {
          throw new Error('Failed to assign task');
        }
      } catch (error) {
        console.error('Error assigning task:', error);

        addNotification({
          title: t('manager.assignmentFailed'),
          message: t('manager.assignmentFailedMsg'),
          type: 'error',
        });
      } finally {
        setAssigningTaskId(null);
      }
    } else {
      addNotification({
        title: t('manager.noMemberSelected'),
        message: t('manager.dropTaskHint'),
        type: 'warning',
      });
    }
  };

  const handleHorizontalScrollEnd = () => {
    setTimeout(() => {
      Object.keys(memberRefs.current).forEach(memberId => {
        const ref = memberRefs.current[memberId];
        if (ref) {
          ref.measureInWindow((pageX, pageY, width, height) => {
            memberPositions.current[memberId] = { pageX, pageY, width, height };
          });
        }
      });
    }, 50);
  };

  const styles = StyleSheet.create({
    ...managerStyles,
    safeArea: { 
      flex: 1, 
      backgroundColor: theme.background 
    },
    container: { 
      padding: 16,
      backgroundColor: theme.background,
      flexGrow: 1,
    },
    sectionTitle: { 
      marginBottom: 16, 
      color: theme.text,
      fontWeight: '600',
      marginLeft: 4
    },
    loadingText: {
      textAlign: 'center',
      color: theme.text,
      marginTop: 20,
    },
    emptyTeamContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    emptyTeamText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.container}
        scrollEnabled={scrollEnabled}
      >
        <View style={styles.membersContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t('manager.teamMembers')}
          </Text>
          
          {isLoading ? (
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          ) : teamMembers.length === 0 ? (
            <View style={styles.emptyTeamContainer}>
              <Text style={styles.emptyTeamText}>
                {t('manager.noTeamMembers', 'No team members available')}
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={horizontalScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={scrollEnabled}
              onMomentumScrollEnd={handleHorizontalScrollEnd}
              onScrollEndDrag={handleHorizontalScrollEnd}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {teamMembers.map(member => {
                const memberId = (member._id || member.id).toString();
                return (
                  <View key={memberId} ref={ref => (memberRefs.current[memberId] = ref)}>
                    <TeamMember
                      member={member}
                      onLayout={updateMemberPosition(memberId)}
                      isActive={highlightedMember === memberId}
                      theme={theme}
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
        
        <View style={styles.tasksContainer}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {t('manager.tasksToAssign')}
          </Text>
          
          {/* Handle loading and task content */}
          {isLoading ? (
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          ) : (
            <View style={styles.tasksGrid}>
              {tasks.length === 0 ? (
                <EmptyState theme={theme} />
              ) : (
                tasks.map(task => (
                  <DraggableTask
                    key={task._id || task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    calculateDropTarget={calculateDropTarget}
                    theme={theme}
                    isAssigning={assigningTaskId === (task._id || task.id)}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManagerScreen;