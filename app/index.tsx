import React, { useEffect, useMemo, useContext, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { fetchItems, initDatabase, fetchCategories } from '@/lib/database';
import ItemCard from '../components/ItemCard';
import EditModal from '../components/EditModal';
import { useFocusEffect } from '@react-navigation/native';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '@/lib/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AddItemModal from '@/components/AddItemModal';



type NamePriceSortOption = {
  label: string;
  field: 'name' | 'price';
  order: 'asc' | 'desc';
};

type CategorySortOption = {
  label: string;
  field: 'category';
};

type SortOption = NamePriceSortOption | CategorySortOption;

export default function ItemsScreen() {
  const { items, setItems } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await initDatabase();
        const fetchedItems = await fetchItems();
        setItems(fetchedItems);
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories);
      };
      loadData();
    }, [])
  );

  // Map the colorScheme to gradient colors.
  const gradientColorsMap = {
    blue: ['#4FADF7', '#2E90FA'],
    green: ['#6EE7B7', '#34D399'],
    red: ['#F87171', '#EF4444'],
    purple: ['#A78BFA', '#8B5CF6'],
  };
  const gradientColors = gradientColorsMap[colorScheme] || gradientColorsMap.blue;



  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      (item.categoryId !== undefined && selectedCategories.includes(item.categoryId));
    return matchesSearch && matchesCategory;
  });

  const sortedItems = useMemo(() => {
    if (sortOption && sortOption.field !== 'category') {
      const { field, order } = sortOption as NamePriceSortOption;
      return [...filteredItems].sort((a, b) => {
        if (typeof a[field] === 'number' && typeof b[field] === 'number') {
          return order === 'asc'
            ? a[field] - b[field]
            : b[field] - a[field];
        }
        const aField = String(a[field]).toLowerCase();
        const bField = String(b[field]).toLowerCase();
        if (aField < bField) return order === 'asc' ? -1 : 1;
        if (aField > bField) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [filteredItems, sortOption]);

  const sections = useMemo(() => {
    if (sortOption && sortOption.field === 'category') {
      return categories
        .map((category) => ({
          title: category.name,
          data: items.filter((item) => item.categoryId === category.id), // Use `items` instead of `filteredItems`
        }))
        .filter((section) => section.data.length > 0);
    }
    return [];
  }, [sortOption, categories, items]); // Use `items` instead of `filteredItems`
  

  const sortOptions: SortOption[] = [
    { label: 'Name Ascending', field: 'name', order: 'asc' },
    { label: 'Name Descending', field: 'name', order: 'desc' },
    { label: 'Price Ascending', field: 'price', order: 'asc' },
    { label: 'Price Descending', field: 'price', order: 'desc' },
    { label: 'Category', field: 'category' },
  ];

  const openEditModal = (item: ItemType) => {
    setSelectedItem(item);
    setEditModalVisible(true);
  };

  const renderItem = ({ item }: { item: ItemType }) => (
    <ItemCard item={item} onEdit={openEditModal} />
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      {/* Header */}
      <View style={tw`px-4 py-3 border-b border-gray-300 bg-white shadow-lg`}>
        <Text style={tw`text-2xl font-bold text-black`}>Items</Text>
      </View>

      <View style={tw`flex-1 px-4 mt-2`}>
        {/* Search Bar */}
        <TextInput
          placeholder="Search items..."
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={tw`bg-white border border-gray-300 px-4 py-2 rounded mb-4 shadow-lg`}
        />

        {/* Filter & Sort Buttons */}
        <View style={tw`flex-row justify-center mb-2`}>
          <GradientButton text="Filter Categories" icon="filter-list" onPress={() => setShowFilterModal(true)} />
          <GradientButton text="Sort Items" icon="sort" onPress={() => setShowSortModal(true)} />
        </View>

        {/* Item List */}
        {sortOption && sortOption.field === 'category' ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ItemCard item={item} onEdit={openEditModal} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={tw`bg-gray-200 px-4 py-2 font-bold text-black`}>{title}</Text>
            )}
            ListEmptyComponent={<Text style={tw`text-gray-600 text-center mt-4`}>No items found.</Text>}
          />
        ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2} // 💡 Enables grid layout
          columnWrapperStyle={tw`justify-between`}
          ListEmptyComponent={<Text style={tw`text-gray-600 text-center mt-4`}>No items found.</Text>}
        />

        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-70`}>
          <View style={tw`w-11/12 bg-white rounded-xl p-6 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-2xl font-semibold text-gray-800`}>Filter by Categories</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={28} color="gray" />
              </Pressable>
            </View>
            <View style={tw`flex-row flex-wrap justify-start`}>
              <TouchableOpacity
                onPress={() => setSelectedCategories([])}
                style={[
                  tw`p-3 m-1 rounded-full border`,
                  selectedCategories.length === 0
                    ? tw`bg-${colorScheme}-500 border-${colorScheme}-500`
                    : tw`bg-white border-gray-300`,
                ]}
              >
                <Text
                  style={
                    selectedCategories.length === 0
                      ? tw`text-white font-medium`
                      : tw`text-gray-800 font-medium`
                  }
                >
                  <MaterialIcons
                    name="category"
                    size={16}
                    color={selectedCategories.length === 0 ? 'white' : 'gray'}
                  />{' '}
                  All
                </Text>
              </TouchableOpacity>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => toggleCategoryFilter(category.id)}
                    style={[
                      tw`p-3 m-1 rounded-full border`,
                      selectedCategories.includes(category.id)
                        ? tw`bg-${colorScheme}-500 border-${colorScheme}-500`
                        : tw`bg-white border-gray-300`,
                    ]}
                  >
                    <Text
                      style={
                        selectedCategories.includes(category.id)
                          ? tw`text-white font-medium`
                          : tw`text-gray-800 font-medium`
                      }
                    >
                      <MaterialIcons
                        name="category"
                        size={16}
                        color={selectedCategories.includes(category.id) ? 'white' : 'gray'}
                      />{' '}
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={tw`text-gray-600 text-center`}>No categories available.</Text>
              )}
            </View>
            <Pressable
              onPress={() => setShowFilterModal(false)}
              style={tw`mt-6 py-3 bg-${colorScheme}-500 rounded-xl shadow-lg`}
            >
              <Text style={tw`text-white text-center font-semibold`}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-70`}>
          <View style={tw`w-11/12 bg-white rounded-xl p-6 shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-2xl font-semibold text-gray-800`}>Sort Items</Text>
              <Pressable onPress={() => setShowSortModal(false)}>
                <MaterialIcons name="close" size={28} color="gray" />
              </Pressable>
            </View>
            {sortOptions.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  setSortOption(option);
                  setShowSortModal(false);
                }}
                style={tw`py-3 border-b border-gray-200`}
              >
                <Text style={tw`text-gray-800 font-medium`}>{option.label}</Text>
              </Pressable>
            ))}
            {sortOption && (
              <Pressable
                onPress={() => {
                  setSortOption(null);
                  setShowSortModal(false);
                }}
                style={tw`mt-4 py-3 bg-${colorScheme}-500 rounded-xl shadow-lg`}
              >
                <Text style={tw`text-white text-center font-semibold`}>Clear Sorting</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      {selectedItem && (
        <EditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          type="item"
          data={selectedItem}
          refresh={(updatedItem) =>
            setItems((prev) =>
              prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
            )
          }
        />
      )}

      {/* Floating Add Button */}
      {!addModalVisible && (
        <View
          style={[
            tw`absolute bottom-5 right-5 w-12 h-12 rounded-full shadow-lg`,
            { backgroundColor: gradientColors[0], alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
          ]}
        >
          <TouchableOpacity onPress={() => setAddModalVisible(true)}>
            <MaterialIcons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Add Item Modal */}
      <AddItemModal visible={addModalVisible} onClose={() => setAddModalVisible(false)} />
    </SafeAreaView>
  );
}

// Custom Gradient Button used for Filter/Sort actions.
const GradientButton = ({
  text,
  icon,
  onPress,
}: {
  text: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) => {
  const { colorScheme } = useContext(ThemeContext);
  const gradientColorsMap = {
    blue: ['#4FADF7', '#2E90FA'],
    green: ['#6EE7B7', '#34D399'],
    red: ['#F87171', '#EF4444'],
    purple: ['#A78BFA', '#8B5CF6'],
  };
  const gradientColors = gradientColorsMap[colorScheme] || gradientColorsMap.blue;
  const gradientColorsSafe = gradientColors as unknown as readonly [string, string];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, marginHorizontal: 4, borderRadius: 25, overflow: 'hidden' }}
    >
      <LinearGradient
        colors={gradientColorsSafe}
        start={[0, 0]}
        end={[1, 0]}
        style={tw`flex-row items-center justify-center py-2`}
      >
        {icon && <MaterialIcons name={icon} size={20} color="white" style={tw`mr-2`} />}
        <Text style={tw`text-white font-bold text-sm`}>
        {text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};