import React, { useEffect, useMemo, useContext } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'tailwind-react-native-classnames';
import { fetchItems, initDatabase, fetchCategories } from '@/lib/database';
import ItemCard from '../components/ItemCard';
import EditModal from '../components/EditModal';
import { useFocusEffect } from '@react-navigation/native';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '@/lib/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AddItemModal from '@/components/AddItemModal'; // Import the Add Item Modal component

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categories, setCategories] = React.useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [showSortModal, setShowSortModal] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption | null>(null);
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ItemType | null>(null);
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  const router = useRouter();

  // Animated values for chathead button.
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  // Map the colorScheme to gradient colors.
  const gradientColorsMap = {
    blue: ['#4FADF7', '#2E90FA'] as const,
    green: ['#6EE7B7', '#34D399'] as const,
    red: ['#F87171', '#EF4444'] as const,
    purple: ['#A78BFA', '#8B5CF6'] as const,
  };
  const gradientColors = gradientColorsMap[colorScheme] || gradientColorsMap.blue;

  useFocusEffect(
    React.useCallback(() => {
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

  // Chathead pulse effect.
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleChatheadPress = () => {
    // Shrink animation before opening the Add Item Modal.
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAddModalVisible(true);
    });
  };

  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
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
            ? (a[field] as number) - (b[field] as number)
            : (b[field] as number) - (a[field] as number);
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
          data: filteredItems.filter((item) => item.categoryId === category.id),
        }))
        .filter((section) => section.data.length > 0);
    }
    return [];
  }, [sortOption, categories, filteredItems]);

  const sortOptions: SortOption[] = [
    { label: 'Name Ascending', field: 'name', order: 'asc' },
    { label: 'Name Descending', field: 'name', order: 'desc' },
    { label: 'Price Ascending', field: 'price', order: 'asc' },
    { label: 'Price Descending', field: 'price', order: 'desc' },
    { label: 'Category', field: 'category' },
  ];

  // Handler to open the edit modal for a specific item.
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

        {/* Enhanced Filter & Sort Buttons */}
        <View style={tw`flex-row justify-between mb-6`}>
          <GradientButton text="Filter Categories" onPress={() => setShowFilterModal(true)} />
          <GradientButton text="Sort Items" onPress={() => setShowSortModal(true)} />
        </View>

        {/* Render SectionList or FlatList */}
        {sortOption && sortOption.field === 'category' ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ItemCard item={item} onEdit={openEditModal} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={tw`bg-gray-200 px-4 py-2 font-bold text-black`}>{title}</Text>
            )}
            ListEmptyComponent={
              <Text style={tw`text-gray-600 text-center mt-4`}>No items found.</Text>
            }
          />
        ) : (
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={tw`text-gray-600 text-center mt-4`}>No items found.</Text>
            }
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
            {/* Modal Header */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-2xl font-semibold text-gray-800`}>
                Filter by Categories
              </Text>
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
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-70`}>
          <View style={tw`w-11/12 bg-white rounded-xl p-6 shadow-2xl`}>
            {/* Modal Header */}
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

      {/* Edit Modal rendered at screen level */}
      {selectedItem && (
        <EditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          type="item"
          data={selectedItem}
          refresh={(updatedItem) =>
            setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)))
          }
        />
      )}

      {/* Floating Chathead Button */}
      {!addModalVisible && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 50,
              height: 50,
              borderRadius: 30,
              backgroundColor: gradientColors[0],
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
            },
          ]}
        >
          <TouchableOpacity onPress={handleChatheadPress}>
            <MaterialIcons name="add" size={32} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }}
      />
    </SafeAreaView>
  );
}

// Custom Gradient Button for Filter/Sort actions.
const GradientButton = ({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ flex: 1, marginHorizontal: 4, borderRadius: 25, overflow: 'hidden' }}
  >
    <LinearGradient
      colors={['#4FADF7', '#2E90FA']}
      start={[0, 0]}
      end={[1, 0]}
      style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={tw`text-white font-semibold text-base`}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);
