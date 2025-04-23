import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text, Avatar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../utils/ThemeContext';
import i18n from '../../i18n'; 

const TeamCard = ({ team, onEditTeam, onDeleteTeam }) => {
  const { theme } = useTheme();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (id) => {
    const colors = [
      '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9',
      '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9',
      '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2',
    ];
    const hash = String(id)
      .split('')
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & a, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const managerId = team.manager?._id || team.manager?.id || 'unknown';
  const managerName = team.manager?.fullname || team.manager?.name || 'Unknown Manager';
  const managerInitials = getInitials(managerName);
  const avatarColor = getAvatarColor(managerId);

  return (
    <Card style={[styles.teamCard, { backgroundColor: theme.background }]} elevation={4}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <View style={styles.teamTitleSection}>
            <Text style={[styles.teamName, { color: theme.text }]}>{team.name}</Text>
            <Chip mode="outlined" style={styles.memberChip}>
              {i18n.t('admin.membersCount', { count: team.members?.length || 0 })}
            </Chip>
          </View>
          <View style={styles.teamActions}>
            <TouchableOpacity onPress={() => onEditTeam(team)} style={styles.actionIcon}>
              <Icon name="pencil" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteTeam(team)} style={styles.actionIcon}>
              <Icon name="delete" size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.managerSection}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>{i18n.t('admin.manager')}</Text>
          <View style={styles.managerInfo}>
            <Avatar.Text
              size={48}
              label={managerInitials}
              style={[styles.managerAvatar, { backgroundColor: avatarColor }]}
              labelStyle={styles.managerAvatarLabel}
            />
            <View style={styles.managerDetails}>
              <Text style={[styles.managerName, { color: theme.text }]}>{managerName}</Text>
              <Text style={[styles.managerEmail, { color: theme.textSecondary }]}>
                {team.manager?.email || i18n.t('admin.noEmail')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>{i18n.t('admin.members')}</Text>
          {team.members && team.members.length > 0 ? (
            <View style={styles.membersList}>
              {team.members.map((member) => {
                const memberId = member._id || member.id || 'unknown';
                const memberName = member.fullname || member.name || 'Unknown Member';
                const memberInitials = getInitials(memberName);
                const memberAvatarColor = getAvatarColor(memberId);

                return (
                  <View key={memberId} style={styles.memberItem}>
                    <Avatar.Text
                      size={36}
                      label={memberInitials}
                      style={[styles.memberAvatar, { backgroundColor: memberAvatarColor }]}
                    />
                    <View style={styles.memberDetails}>
                      <Text style={[styles.memberName, { color: theme.text }]}>{memberName}</Text>
                      <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                        {member.email || i18n.t('admin.noEmail')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.noMembers, { color: theme.textSecondary }]}>
              {i18n.t('admin.noMembers')}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  teamCard: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamTitleSection: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberChip: {
    alignSelf: 'flex-start',
  },
  teamActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 16,
    padding: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  managerSection: {
    marginBottom: 16,
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerAvatar: {
    marginRight: 12,
  },
  managerAvatarLabel: {
    fontWeight: 'bold',
  },
  managerDetails: {
    flex: 1,
  },
  managerName: {
    fontWeight: '600',
    fontSize: 16,
  },
  managerEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  membersSection: {
    marginTop: 8,
  },
  membersList: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  memberAvatar: {
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontWeight: '500',
    fontSize: 14,
  },
  memberEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  noMembers: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 4,
  },
});

export default TeamCard;
