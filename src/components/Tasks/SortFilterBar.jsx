import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Menu,
  Button,
  Divider,
  useTheme,
  Chip,
  Surface,
  Text,
  Searchbar
} from 'react-native-paper';
import { useTheme as useCustomTheme } from '../../utils/ThemeContext';
import { useTranslation } from 'react-i18next';

const SortFilterBar = ({
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  searchQuery,
  setSearchQuery
}) => {
  const paperTheme = useTheme();
  const { theme: customTheme } = useCustomTheme();
  const { t } = useTranslation();

  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  // Define sort items using translation keys
  const sortFieldItems = [
    { label: t('sortFilter.sortField.status'), value: 'status' },
    { label: t('sortFilter.sortField.priority'), value: 'priority' }
  ];

  const sortOrderItems = [
    { label: t('sortFilter.sortOrder.asc'), value: 'asc' },
    { label: t('sortFilter.sortOrder.desc'), value: 'desc' }
  ];

  const filterStatusItems = [
    { label: t('sortFilter.filterStatus.all'), value: 'All' },
    { label: t('sortFilter.filterStatus.toDo'), value: 'to do' },
    { label: t('sortFilter.filterStatus.inProgress'), value: 'in progress' },
    { label: t('sortFilter.filterStatus.completed'), value: 'completed' },
    { label: t('sortFilter.filterStatus.overdue'), value: 'overdue' }
  ];

  const filterPriorityItems = [
    { label: t('sortFilter.filterPriority.all'), value: 'All' },
    { label: t('sortFilter.filterPriority.low'), value: 'low' },
    { label: t('sortFilter.filterPriority.medium'), value: 'medium' },
    { label: t('sortFilter.filterPriority.high'), value: 'high' }
  ];

  return (
    <Surface style={[styles.container, { backgroundColor: customTheme.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('sortFilter.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={customTheme.primary}
          inputStyle={{ color: customTheme.text }}
          placeholderTextColor={customTheme.placeholder}
        />
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.buttonGroup}>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                onPress={() => setSortMenuVisible(true)}
                icon="sort"
                textColor={customTheme.primary}
                style={styles.button}
              >
                {sortField
                  ? `${t('sortFilter.sort')}: ${t(`sortFilter.sortField.${sortField}`)}`
                  : t('sortFilter.sort')}
              </Button>
            }
            style={[styles.menu, { backgroundColor: customTheme.background }]}
          >
            <Text style={[styles.menuTitle, { color: customTheme.text }]}>{t('sortFilter.sortBy')}</Text>
            {sortFieldItems.map((item) => (
              <Menu.Item
                key={item.value}
                onPress={() => {
                  setSortField(item.value);
                  setSortMenuVisible(false);
                }}
                title={item.label}
                titleStyle={{ color: customTheme.text }}
              />
            ))}
            <Divider style={styles.divider} />
            <Text style={[styles.menuTitle, { color: customTheme.text }]}>{t('sortFilter.order')}</Text>
            {sortOrderItems.map((item) => (
              <Menu.Item
                key={item.value}
                onPress={() => {
                  setSortOrder(item.value);
                  setSortMenuVisible(false);
                }}
                title={item.label}
                titleStyle={{ color: customTheme.text }}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.buttonGroup}>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <Button
                onPress={() => setFilterMenuVisible(true)}
                icon="filter"
                textColor={customTheme.primary}
                style={styles.button}
              >
                {t('sortFilter.filter')}
              </Button>
            }
            style={[styles.menu, { backgroundColor: customTheme.background }]}
          >
            <View style={[styles.filterMenu, { backgroundColor: customTheme.background }]}>
              <Text style={[styles.menuTitle, { color: customTheme.text }]}>{t('sortFilter.filterStatusTitle')}</Text>
              <View style={styles.chipContainer}>
                {filterStatusItems.map((item) => (
                  <Chip
                    key={item.value}
                    selected={filterStatus === item.value}
                    onPress={() => {
                      setFilterStatus(item.value);
                      setFilterMenuVisible(false);
                    }}
                    style={styles.chip}
                    mode="outlined"
                    selectedColor={customTheme.primary}
                    textStyle={{ color: customTheme.text, fontSize: 14 }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
              <Divider style={styles.divider} />
              <Text style={[styles.menuTitle, { color: customTheme.text }]}>{t('sortFilter.filterPriorityTitle')}</Text>
              <View style={styles.chipContainer}>
                {filterPriorityItems.map((item) => (
                  <Chip
                    key={item.value}
                    selected={filterPriority === item.value}
                    onPress={() => {
                      setFilterPriority(item.value);
                      setFilterMenuVisible(false);
                    }}
                    style={styles.chip}
                    mode="outlined"
                    selectedColor={customTheme.primary}
                    textStyle={{ color: customTheme.text, fontSize: 14 }}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
            </View>
          </Menu>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  buttonGroup: {
    alignItems: 'center',
  },
  button: {
    margin: 0,
  },
  menu: {
    marginTop: 60,
    left:200,
    width:"40%"
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  divider: {
    marginVertical: 4,
  },
  filterMenu: {
    Width: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  chip: {
    margin: 2,
    paddingHorizontal: 8,
    height: 32,
  },
});

export default SortFilterBar;
