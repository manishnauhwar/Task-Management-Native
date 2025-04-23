import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { Card, Text, Chip, useTheme as usePaperTheme, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../utils/ThemeContext';
import { taskStyles } from '../../styles/manager';

const DraggableTask = ({ task, onDragStart, onDragEnd, calculateDropTarget, isAssigning }) => {
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const cardWidth = Math.min(width * 0.9, 380);
  const fontSize = {
    title: Math.min(16, width / 25),
    description: Math.min(14, width / 30),
    date: Math.min(12, width / 35),
    hint: Math.min(12, width / 35),
    priority: Math.min(11, width / 40),
  };

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

  const styles = StyleSheet.create({
    ...taskStyles,
    taskWrapper: {
      marginVertical: 6,
      width: cardWidth,
      alignSelf: 'center',
    },
    taskCard: {
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.cardBackground,
      shadowColor: theme.dark ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: dragging ? 8 : 3,
      opacity: isAssigning ? 0.7 : 1,
    },
    taskCardContent: {
      padding: 12,
    },
    taskTitle: {
      fontSize: fontSize.title,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      marginRight: 10,
      marginBottom: 4,
    },
    taskDescription: {
      color: theme.textSecondary,
      fontSize: fontSize.description,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    dateText: {
      color: theme.textSecondary,
      fontSize: fontSize.date,
    },
    dragHintText: {
      fontSize: fontSize.hint,
      fontStyle: 'italic',
      color: theme.textSecondary,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      zIndex: 1,
    },
    priorityChip: { 
      height: Math.max(30, height / 28), 
      borderRadius: 16, 
      paddingHorizontal: Math.min(Math.max(12, width / 40), 20),
      paddingVertical: 0,
      minWidth: Math.max(70, width / 6),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginBottom: 4,
    },
    taskHeader: { 
      flexDirection: 'row', 
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      marginBottom: 6,
    },
    taskFooter: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 12, 
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
  });

  const getPriorityText = (priority) => {
    if (width < 350) {
      if (priority === 'High') return t('manager.highShort', 'High');
      if (priority === 'Medium') return t('manager.mediumShort', 'Med');
      if (priority === 'Low') return t('manager.lowShort', 'Low');
    }
    return priority || t('manager.normalPriority');
  };

  return (
    <Animated.View
      style={[styles.taskWrapper, dragging && styles.draggedTask, pan.getLayout()]}
      {...(isAssigning ? {} : panResponder.panHandlers)}
    >
      <Card style={styles.taskCard}>
        {isAssigning && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
        <Card.Content style={styles.taskCardContent}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle} numberOfLines={1} adjustsFontSizeToFit>
              {task.title}
            </Text>
            <Chip
              mode="outlined"
              style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
              textStyle={{ 
                color: getPriorityColor(task.priority), 
                fontSize: fontSize.priority,
                textAlign: 'center',
                lineHeight: Math.max(20, height / 42),
                fontWeight: '500',
              }}
            >
              {getPriorityText(task.priority)}
            </Chip>
          </View>

          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          <View style={styles.taskFooter}>
            <View style={styles.dateContainer}>
              <Icon
                name="calendar-clock"
                size={Math.max(14, width / 30)}
                color={theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.dateText}>{formatDueDate(task.dueDate)}</Text>
            </View>
            {dragging && (
              <Text style={styles.dragHintText} numberOfLines={1}>
                {t('manager.dropHint')}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

export default DraggableTask;