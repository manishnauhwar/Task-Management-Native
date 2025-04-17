import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import i18n from '../../i18n';

const TeamFormModal = ({ 
  visible, 
  onClose, 
  isEditMode, 
  teamName, 
  setTeamName,
  availableManagers,
  selectedManager,
  setSelectedManager,
  availableMembers,
  selectedMembers,
  toggleMemberSelection,
  onSave,
  isSubmitting
}) => {
  
  const isMemberSelected = (member) => {
    return selectedMembers.some((m) => (m._id || m.id) === (member._id || member.id));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Card.Title title={isEditMode ? i18n.t('admin.editTeam') : i18n.t('admin.createTeam')} />
          <Card.Content>
            <TextInput
              style={styles.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder={i18n.t('admin.teamNamePlaceholder')}
              placeholderTextColor="#9e9e9e"
            />
            
            <Text style={styles.modalLabel}>{i18n.t('admin.selectManager')}</Text>
            <ScrollView style={styles.userList}>
              {availableManagers.length === 0 ? (
                <Text>{i18n.t('admin.noManagersAvailable')}</Text>
              ) : (
                availableManagers.map((manager) => (
                  <TouchableOpacity
                    key={manager._id || manager.id}
                    onPress={() => setSelectedManager(manager)}
                    style={[
                      styles.userItem,
                      selectedManager &&
                        (selectedManager._id || selectedManager.id) === (manager._id || manager.id) &&
                        styles.selectedUser,
                    ]}
                  >
                    <Text>{manager.fullname || manager.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            
            <Text style={styles.modalLabel}>{i18n.t('admin.selectMembers')}</Text>
            <ScrollView style={styles.userList}>
              {availableMembers.length === 0 ? (
                <Text>{i18n.t('admin.noMembersAvailable')}</Text>
              ) : (
                availableMembers.map((member) => (
                  <TouchableOpacity
                    key={member._id || member.id}
                    onPress={() => toggleMemberSelection(member)}
                    style={[
                      styles.userItem,
                      isMemberSelected(member) && styles.selectedUser,
                    ]}
                  >
                    <Text>{member.fullname || member.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Card.Content>
          <Card.Actions style={styles.modalActions}>
            <Button mode="outlined" onPress={onClose} disabled={isSubmitting}>
              {i18n.t('admin.cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={onSave} 
              loading={isSubmitting} 
              disabled={isSubmitting}
            >
              {isEditMode ? i18n.t('admin.update') : i18n.t('admin.create')}
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  userList: {
    maxHeight: 120,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUser: {
    backgroundColor: '#e1f5fe',
  },
  modalActions: {
    justifyContent: 'space-between',
    padding: 16,
  },
});

export default TeamFormModal;
