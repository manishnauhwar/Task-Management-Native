import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Card, Text, Avatar, Chip, useTheme as usePaperTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../utils/ThemeContext';
import { useNotification } from '../utils/NotificationContext';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../utils/axiosinstance';
import { getCurrentUser } from '../utils/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const DraggableTask = ({ task, onDragStart, onDragEnd, calculateDropTarget }) => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const formatDueDate = (dateString) => {
    if (!dateString) return t('manager.noDueDate');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10,
      onPanResponderGrant: () => {
        setDragging(true);
        onDragStart();
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        setDragging(false);
        const dropResult = calculateDropTarget(gestureState);
        onDragEnd(task._id, dropResult);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
        }).start();
      },
    })
  ).current;

  const getPriorityColor = (priority) => {
    if (priority === 'High') return paperTheme.colors.error;
    if (priority === 'Medium') return paperTheme.colors.warning || '#FF9800';
    if (priority === 'Low') return paperTheme.colors.success || '#4CAF50';
    return paperTheme.colors.primary;
  };

  return (
    <Animated.View
      style={[styles.taskWrapper, dragging && styles.draggedTask, pan.getLayout()]}
      {...panResponder.panHandlers}
    >
      <Card style={styles.taskCard} elevation={dragging ? 8 : 2}>
        <Card.Content style={styles.taskCardContent}>
          <View style={styles.taskHeader}>
            <Text variant="titleMedium" style={styles.taskTitle}>
              {task.title}
            </Text>
            <Chip
              mode="outlined"
              style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
              textStyle={{ color: getPriorityColor(task.priority) }}
            >
              {task.priority || t('manager.normalPriority')}
            </Chip>
          </View>
          <View style={styles.taskFooter}>
            <View style={styles.dateContainer}>
              <Icon name="calendar-clock" size={16} color={paperTheme.colors.outline} style={{ marginRight: 4 }} />
              <Text variant="bodySmall">{formatDueDate(task.dueDate)}</Text>
            </View>
            {dragging && (
              <Text variant="bodySmall" style={styles.dragHintText}>
                {t('manager.dropHint')}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const TeamMember = ({ member, onLayout, isActive }) => {
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();

  const getInitials = (name) => {
    if (!name) return t('manager.defaultTeamMember');
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (id) => {
    const colors = [
      '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9',
      '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9',
      '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2',
    ];
    const hash = String(id).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const memberId = member._id || member.id;
  const memberName = member.fullname || member.name || t('manager.defaultTeamMember');
  const initials = getInitials(memberName);
  const avatarColor = getAvatarColor(memberId);

  return (
    <View style={[styles.memberCardContainer, isActive && styles.activeMemberCard]} onLayout={onLayout}>
      <Card style={styles.memberCard} elevation={isActive ? 4 : 2}>
        <Card.Content style={styles.memberCardContent}>
          <Avatar.Text
            size={60}
            label={initials}
            style={[styles.memberAvatar, { backgroundColor: avatarColor }]}
            labelStyle={{ color: '#333' }}
          />
          <Text variant="titleMedium" style={styles.memberName} numberOfLines={1}>
            {memberName}
          </Text>
          <Text variant="bodySmall" style={styles.memberEmail} numberOfLines={1}>
            {member.email}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const ManagerScreen = () => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [highlightedMember, setHighlightedMember] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const memberRefs = useRef({});
  const memberPositions = useRef({});
  const horizontalScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
  const { addNotification } = useNotification();

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);

          if (!user) return;

          const userId = getUserId(user);
          if (userId) {
            await fetchTasks(userId);
            await fetchTeams(userId);
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
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
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
      setTeam({ members: uniqueMembers });
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const updateMemberPosition = (memberId) => (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    memberRefs.current[memberId]?.measureInWindow((pageX, pageY) => {
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
        targetMember = team.members.find(m =>
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
        } else {
          throw new Error('Failed to assign task');
        }
      } catch (error) {
        console.error('Error assigning task:', error);

        addNotification({
          title: t('manager.assignmentFailed'),
          message: t('manager.assignmentFailedMsg'),
          type: 'task_assigned',
        });
      }
    } else {
      addNotification({
        title: t('manager.noMemberSelected'),
        message: t('manager.dropTaskHint'),
        type: 'task_assigned',
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.text === '#ffffff' ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.container}
        scrollEnabled={scrollEnabled}
      >
        <View style={styles.membersContainer}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.text }]}>
            {t('manager.teamMembers')}
          </Text>
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            onMomentumScrollEnd={handleHorizontalScrollEnd}
            onScrollEndDrag={handleHorizontalScrollEnd}
          >
            {team?.members?.map(member => {
              const memberId = (member._id || member.id).toString();
              return (
                <View key={memberId} ref={ref => (memberRefs.current[memberId] = ref)}>
                  <TeamMember
                    member={member}
                    onLayout={updateMemberPosition(memberId)}
                    isActive={highlightedMember === memberId}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.tasksContainer}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.text }]}>
            {t('manager.tasksToAssign')}
          </Text>
          <View style={styles.tasksGrid}>
            {tasks.length === 0 ? (
              <Card style={styles.emptyStateCard}>
                <Card.Content style={styles.emptyStateContent}>
                  <Icon name="clipboard-text-outline" size={50} color={paperTheme.colors.outline} />
                  <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 10 }}>
                    {t('manager.noTasksAvailable')}
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              tasks.map(task => (
                <DraggableTask
                  key={task._id || task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  calculateDropTarget={calculateDropTarget}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 10 },
  membersContainer: { marginBottom: 20 },
  sectionTitle: { marginBottom: 10 },
  tasksContainer: { marginBottom: 20 },
  tasksGrid: { flex: 1 },
  emptyStateCard: { marginVertical: 20, padding: 20 },
  emptyStateContent: { alignItems: 'center', justifyContent: 'center' },
  taskWrapper: {},
  draggedTask: { opacity: 0.8 },
  taskCard: { marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  taskCardContent: { padding: 10 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskTitle: { fontSize: 16, fontWeight: '700' },
  priorityChip: { height: 28, borderRadius: 14, paddingHorizontal: 10 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between' },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dragHintText: { fontSize: 12, fontStyle: 'italic', color: '#888' },
  memberCardContainer: { marginRight: 10 },
  activeMemberCard: { borderWidth: 2, borderColor: '#81b0ff' },
  memberCard: { width: 120, alignItems: 'center' },
  memberCardContent: { alignItems: 'center' },
  memberAvatar: { marginBottom: 8 },
  memberName: { fontSize: 14, fontWeight: '700' },
  memberEmail: { fontSize: 12, color: '#555' },
});

export default ManagerScreen;