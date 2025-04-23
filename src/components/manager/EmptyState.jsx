import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Card, Text, useTheme as usePaperTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ theme }) => {
  const paperTheme = usePaperTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  const iconSize = Math.min(60, width / 7);
  const fontSize = {
    text: Math.min(16, width / 25),
    subText: Math.min(14, width / 30)
  };

  const styles = StyleSheet.create({
    emptyStateCard: { 
      marginVertical: 20, 
      padding: Math.min(20, width / 20),
      backgroundColor: theme.dark ? '#2C2C2E' : '#FFFFFF',
      borderRadius: 12,
      width: '90%',
      alignSelf: 'center',
    },
    emptyStateContent: { 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: Math.min(24, width / 18),
    },
    emptyStateText: {
      textAlign: 'center', 
      marginTop: 16,
      color: theme.dark ? '#FFFFFF' : '#000000',
      fontSize: fontSize.text,
      lineHeight: fontSize.text * 1.4,
      flexWrap: 'wrap',
    },
    emptyStateSubText: {
      textAlign: 'center',
      marginTop: 8,
      color: theme.dark ? '#AAAAAA' : '#666666',
      fontSize: fontSize.subText,
      flexWrap: 'wrap',
    }
  });

  return (
    <Card style={styles.emptyStateCard}>
      <Card.Content style={styles.emptyStateContent}>
        <Icon 
          name="clipboard-text-outline" 
          size={iconSize} 
          color={theme.dark ? '#888888' : '#AAAAAA'} 
        />
        <Text style={styles.emptyStateText} adjustsFontSizeToFit numberOfLines={2}>
          {t('manager.noTasksAvailable')}
        </Text>
        <Text style={styles.emptyStateSubText} adjustsFontSizeToFit>
          {t('manager.createTasksHint', 'Create tasks to assign them to your team members')}
        </Text>
      </Card.Content>
    </Card>
  );
};

export default EmptyState;