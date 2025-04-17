import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme as usePaperTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ theme }) => {
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    emptyStateCard: { 
      marginVertical: 20, 
      padding: 20,
      backgroundColor: theme.dark ? '#2C2C2E' : '#FFFFFF',
      borderRadius: 12,
    },
    emptyStateContent: { 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 24,
    },
    emptyStateText: {
      textAlign: 'center', 
      marginTop: 16,
      color: theme.dark ? '#FFFFFF' : '#000000',
      fontSize: 16,
      lineHeight: 22,
    },
    emptyStateSubText: {
      textAlign: 'center',
      marginTop: 8,
      color: theme.dark ? '#AAAAAA' : '#666666',
      fontSize: 14,
    }
  });

  return (
    <Card style={styles.emptyStateCard}>
      <Card.Content style={styles.emptyStateContent}>
        <Icon 
          name="clipboard-text-outline" 
          size={60} 
          color={theme.dark ? '#888888' : '#AAAAAA'} 
        />
        <Text style={styles.emptyStateText}>
          {t('manager.noTasksAvailable')}
        </Text>
        <Text style={styles.emptyStateSubText}>
          {t('manager.createTasksHint', 'Create tasks to assign them to your team members')}
        </Text>
      </Card.Content>
    </Card>
  );
};

export default EmptyState;