import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { Card, Text, Chip, useTheme as usePaperTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../utils/ThemeContext';
import { taskStyles } from '../../styles/manager';

const DraggableTask = ({ task, onDragStart, onDragEnd, calculateDropTarget }) => {
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
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

  const styles = StyleSheet.create({
    ...taskStyles,
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
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    taskDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    dateText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    dragHintText: {
      fontSize: 12,
      fontStyle: 'italic',
      color: theme.textSecondary,
    },
  });

  return (
    <Animated.View
      style={[styles.taskWrapper, dragging && styles.draggedTask, pan.getLayout()]}
      {...panResponder.panHandlers}
    >
      <Card style={styles.taskCard}>
        <Card.Content style={styles.taskCardContent}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle} numberOfLines={1}>
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

          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          <View style={styles.taskFooter}>
            <View style={styles.dateContainer}>
              <Icon
                name="calendar-clock"
                size={16}
                color={theme.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.dateText}>{formatDueDate(task.dueDate)}</Text>
            </View>
            {dragging && (
              <Text style={styles.dragHintText}>
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