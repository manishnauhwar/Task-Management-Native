import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Menu, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';

const TaskCard = ({ task, teams, onAssignTask }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);

  const formatDueDate = (dateString) => {
    if (!dateString) return t('admin.noDueDate');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <Surface style={styles.taskSurface} elevation={3}>
      <Card style={[styles.taskCard, { backgroundColor: theme.background }]} mode="outlined">
        <Card.Content>
          <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
          <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {task.description || t('admin.noDescription')}
          </Text>
          <View style={styles.taskFooter}>
            <Icon name="calendar-clock" size={18} color={theme.textSecondary} />
            <Text style={[styles.taskDueDate, { color: theme.textSecondary }]}>
              {formatDueDate(task.dueDate)}
            </Text>
          </View>
          <View style={styles.dropdownContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <Button mode="contained" onPress={openMenu} style={styles.dropdownButton}>
                  {t('admin.assignToTeam')}
                </Button>
              }
            >
              {teams.map((team) => (
                <Menu.Item
                  key={team._id || team.id}
                  title={team.name}
                  onPress={() => {
                    onAssignTask(task, team);
                    closeMenu();
                  }}
                />
              ))}
            </Menu>
          </View>
        </Card.Content>
      </Card>
    </Surface>
  );
};

const styles = StyleSheet.create({
  taskSurface: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  taskCard: {
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDueDate: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  dropdownContainer: {
    alignItems: 'flex-start',
  },
  dropdownButton: {
    marginTop: 8,
  },
});

export default TaskCard;
