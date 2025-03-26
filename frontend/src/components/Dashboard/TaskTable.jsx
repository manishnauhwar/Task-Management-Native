import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal
} from 'react-native';
import React, { useEffect, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../utils/ThemeContext';

const API_URL = 'https://67dd0778e00db03c4069dbf8.mockapi.io/tasks';

const TaskTable = ({
  sortField = '',
  sortOrder = 'asc',
  filterStatus = 'All',
  filterPriority = 'All'
}) => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [addmodal, setAddmodal] = useState(false);
  const [newtask, setNewtask] = useState({
    title: '',
    priority: 'Low',
    status: 'Pending',
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' }
  ]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      setTasks(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const addTask = async () => {
    if (!newtask.title.trim()) {
      alert("Title can't be empty!");
      return;
    }

    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newtask.dueDate)) {
      alert("Please enter a valid date in YYYY-MM-DD format!");
      return;
    }

    try {
      const date = new Date(newtask.dueDate);
      if (isNaN(date.getTime())) {
        alert("Please enter a valid date!");
        return;
      }

      const task = { ...newtask, id: Date.now().toString() };
      const res = await axios.post(API_URL, task);
      setTasks([...tasks, res.data]);
      setAddmodal(false);
      setNewtask({ title: '', priority: 'Low', status: 'Pending', dueDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error(error);
      alert("Failed to add task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error(error);
    }
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const updateTask = async () => {
    try {
      await axios.put(`${API_URL}/${selectedTask.id}`, selectedTask);
      setTasks(tasks.map(t => (t.id === selectedTask.id ? selectedTask : t)));
      setModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const safeLower = (value) => (value ? value.toString().toLowerCase() : '');
  const getStatusLower = (task) => safeLower(task.status);
  const getPriorityLower = (task) => safeLower(task.priority);
  const normFilterStatus = safeLower(filterStatus);
  const normFilterPriority = safeLower(filterPriority);

  const filteredTasks = tasks.filter(task => {
    const statusMatch =
      normFilterStatus === 'all' || getStatusLower(task) === normFilterStatus;
    const priorityMatch =
      normFilterPriority === 'all' || getPriorityLower(task) === normFilterPriority;
    return statusMatch && priorityMatch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortField) return 0;
    const valA = safeLower(a[sortField]);
    const valB = safeLower(b[sortField]);

    if (sortField === 'priority') {
      if (sortOrder === 'asc') {
        const orderAsc = { high: 1, medium: 2, low: 3 };
        return (orderAsc[valA] || 999) - (orderAsc[valB] || 999);
      } else {
        const orderDesc = { low: 1, medium: 2, high: 3 };
        return (orderDesc[valA] || 999) - (orderDesc[valB] || 999);
      }
    } else if (sortField === 'status') {
      if (sortOrder === 'asc') {
        const orderAsc = { completed: 1, 'in progress': 2, pending: 3, overdue: 4 };
        return (orderAsc[valA] || 999) - (orderAsc[valB] || 999);
      } else {
        const orderDesc = { overdue: 1, pending: 2, 'in progress': 3, completed: 4 };
        return (orderDesc[valA] || 999) - (orderDesc[valB] || 999);
      }
    } else {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
  });

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <View style={styles.addContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setAddmodal(true)}
        >
          <Text style={[styles.addButtonText, { color: theme.buttonText }]}>
            + Add Task
          </Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.tableContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.tableContent}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeader, { color: theme.cardHeaderText }]}>Title</Text>
            <Text style={[styles.tableHeader, { color: theme.cardHeaderText }]}>Status</Text>
            <Text style={[styles.tableHeader, { color: theme.cardHeaderText }]}>Priority</Text>
            <Text style={[styles.tableHeader, { color: theme.cardHeaderText }]}>Due Date</Text>
            <Text style={[styles.tableHeader, { color: theme.cardHeaderText }]}>Action</Text>
          </View>
          <ScrollView
            style={styles.tableBody}
            contentContainerStyle={styles.tableBodyContent}
            nestedScrollEnabled={true}
          >
            {loading ? (
              <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
            ) : (
              sortedTasks.map((task, index) => (
                <View
                  key={task.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow
                  ]}
                >
                  <Text style={[styles.tableCell, { color: theme.text }]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.tableCell, { color: theme.text }]}>
                    {task.status}
                  </Text>
                  <Text style={[styles.tableCell, { color: theme.text }]}>
                    {task.priority}
                  </Text>
                  <Text style={[styles.tableCell, { color: theme.text }]}>
                    {task.dueDate}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => openUpdateModal(task)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="pencil" size={20} color="#28a745" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteTask(task.id)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Update Task
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Title"
              placeholderTextColor={theme.placeholder}
              value={selectedTask?.title}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, title: text })}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Status"
              placeholderTextColor={theme.placeholder}
              value={selectedTask?.status}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, status: text })}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Priority"
              placeholderTextColor={theme.placeholder}
              value={selectedTask?.priority}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, priority: text })}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Due Date (YYYY-MM-DD)"
              placeholderTextColor={theme.placeholder}
              value={selectedTask?.dueDate}
              onChangeText={(text) => setSelectedTask({ ...selectedTask, dueDate: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={updateTask}>
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={addmodal}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalWrapper}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Add Task
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Title"
              placeholderTextColor={theme.placeholder}
              value={newtask.title}
              onChangeText={(text) => setNewtask({ ...newtask, title: text })}
            />
            <DropDownPicker
              listMode="SCROLLVIEW"
              open={open}
              value={newtask.priority}
              items={items}
              setOpen={setOpen}
              setValue={(callback) => {
                const newVal = callback(newtask.priority);
                setNewtask({ ...newtask, priority: newVal });
              }}
              setItems={setItems}
              style={{
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 10,
                marginBottom: 15
              }}
              dropDownContainerStyle={{
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 10,
                zIndex: 13
              }}
              placeholderStyle={{ color: theme.placeholder }}
              textStyle={{ color: theme.text }}
              listItemContainerStyle={{ backgroundColor: theme.inputBackground }}
              listItemLabelStyle={{ color: theme.text }}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Due Date (YYYY-MM-DD)"
              placeholderTextColor={theme.placeholder}
              value={newtask.dueDate}
              onChangeText={(text) => setNewtask({ ...newtask, dueDate: text })}
            />
            <View
              style={[
                styles.statictextcontainer,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border
                }
              ]}
            >
              <Text style={[styles.staticText, { color: theme.text }]}>
                Status: Pending
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={addTask}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setAddmodal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    padding: 15,
  },
  addContainer: {
    width: '40%',
    marginBottom: 15,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center'
  },
  addButtonText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#fff'
  },
  tableContainer: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#343a40',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  tableContent: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#343a40',
    paddingVertical: 8,
    zIndex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingVertical: 8,
    alignItems: 'center'
  },
  tableHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16
  },
  tableBody: {
    flex: 1,
    maxHeight: '100%',
  },
  tableBodyContent: {
    flexGrow: 1,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  iconButton: {
    padding: 4
  },
  modalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#343a40'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 14
  },
  statictextcontainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#e9ecef'
  },
  staticText: {
    fontSize: 14,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20
  },
  modalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  cancelModalButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20
  }
});

export default TaskTable;
