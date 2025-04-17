import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../utils/ThemeContext';
import { memberStyles } from '../../styles/manager';

const TeamMember = ({ member, onLayout, isActive }) => {
  const { theme } = useTheme();
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

  const styles = StyleSheet.create({
    ...memberStyles,
    memberCardContainer: {
      marginRight: 12,
      padding: isActive ? 4 : 0,
      borderRadius: 16,
      borderWidth: isActive ? 2 : 0,
      borderColor: theme.primary,
      backgroundColor: isActive ? (theme.dark ? 'rgba(58, 134, 255, 0.2)' : 'rgba(58, 134, 255, 0.1)') : 'transparent',
    },
    memberCard: {
      width: 130,
      borderRadius: 12,
      backgroundColor: theme.cardBackground,
      shadowColor: theme.dark ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: isActive ? 6 : 2,
    },
    memberCardContent: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    memberName: {
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 8,
      color: theme.text,
    },
    memberEmail: {
      fontSize: 12,
      textAlign: 'center',
      color: theme.textSecondary,
    },
    taskCountBadge: {
      position: 'absolute',
      right: 10,
      top: 10,
      backgroundColor: theme.primary,
      borderRadius: 10,
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskCountText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    }
  });

  return (
    <View style={styles.memberCardContainer} onLayout={onLayout}>
      <Card style={styles.memberCard}>
        <Card.Content style={styles.memberCardContent}>
          <Avatar.Text
            size={60}
            label={initials}
            style={{ backgroundColor: avatarColor }}
            labelStyle={{ color: '#333' }}
          />
          <Text style={styles.memberName} numberOfLines={1}>
            {memberName}
          </Text>
          {member.email && (
            <Text style={styles.memberEmail} numberOfLines={1}>
              {member.email}
            </Text>
          )}
          {member.taskCount && (
            <View style={styles.taskCountBadge}>
              <Text style={styles.taskCountText}>{member.taskCount}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

export default TeamMember;