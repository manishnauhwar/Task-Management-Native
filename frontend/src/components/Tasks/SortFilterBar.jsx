import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../../utils/ThemeContext';

const SortFilterBar = ({
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority
}) => {
  const { theme } = useTheme();
  const [openSortField, setOpenSortField] = useState(false);
  const [openSortOrder, setOpenSortOrder] = useState(false);
  const [openFilterStatus, setOpenFilterStatus] = useState(false);
  const [openFilterPriority, setOpenFilterPriority] = useState(false);

  const sortFieldItems = [
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' }
  ];
  const sortOrderItems = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' }
  ];
  const filterStatusItems = [
    { label: 'All', value: 'All' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'In Progress', value: 'in progress' }
  ];
  const filterPriorityItems = [
    { label: 'All', value: 'All' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.row, { zIndex: 4 }]}>
        <DropDownPicker
          listMode="SCROLLVIEW"
          open={openSortField}
          value={sortField}
          items={sortFieldItems}
          setOpen={setOpenSortField}
          setValue={setSortField}
          placeholder="Sort Field"
          placeholderStyle={{ color: theme.placeholder }}
          textStyle={{ color: theme.text }}
          containerStyle={[styles.dropdownContainer, { zIndex: 4 }]}
          style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          dropDownContainerStyle={[styles.dropDownContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border, zIndex: 4 }]}
        />
        <DropDownPicker
          listMode="SCROLLVIEW"
          open={openSortOrder}
          value={sortOrder}
          items={sortOrderItems}
          setOpen={setOpenSortOrder}
          setValue={setSortOrder}
          placeholder="Sort Order"
          placeholderStyle={{ color: theme.placeholder }}
          textStyle={{ color: theme.text }}
          containerStyle={[styles.dropdownContainer, { zIndex: 4 }]}
          style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          dropDownContainerStyle={[styles.dropDownContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border, zIndex: 4 }]}
        />
      </View>
      <View style={[styles.row, { zIndex: 3 }]}>
        <DropDownPicker
          listMode="SCROLLVIEW"
          open={openFilterStatus}
          value={filterStatus}
          items={filterStatusItems}
          setOpen={setOpenFilterStatus}
          setValue={setFilterStatus}
          placeholder="Filter by Status"
          placeholderStyle={{ color: theme.placeholder }}
          textStyle={{ color: theme.text }}
          containerStyle={[styles.dropdownContainer, { zIndex: 3 }]}
          style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          dropDownContainerStyle={[styles.dropDownContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border, zIndex: 3 }]}
        />
        <DropDownPicker
          listMode="SCROLLVIEW"
          open={openFilterPriority}
          value={filterPriority}
          items={filterPriorityItems}
          setOpen={setOpenFilterPriority}
          setValue={setFilterPriority}
          placeholder="Filter by Priority"
          placeholderStyle={{ color: theme.placeholder }}
          textStyle={{ color: theme.text }}
          containerStyle={[styles.dropdownContainer, { zIndex: 3 }]}
          style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          dropDownContainerStyle={[styles.dropDownContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border, zIndex: 3 }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    padding: 15,
    margin: 10,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  dropdownContainer: {
    flex: 0.48
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10
  },
  dropDownContainer: {
    borderRadius: 10
  }
});

export default SortFilterBar;
