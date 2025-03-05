// index.tsx
import React, { useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'tailwind-react-native-classnames';
import { fetchItems, initDatabase, fetchCategories } from '@/lib/database';
import ItemCard from '../components/ItemCard';
import { useFocusEffect } from '@react-navigation/native';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categories, setCategories] = React.useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [showSortModal, setShowSortModal] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<SortOption | null>(null);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        await initDatabase();
        const fetchedItems = await fetchItems();
        setItems(fetchedItems);
        const fetchedCategories = await fetchCategories();
        console.log('Fetched categories in index.tsx:', fetchedCategories);
        setCategories(fetchedCategories);
      };
      loadData();
    }, [])
  );

  const toggleCategoryFilter = (categoryId: number) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const filteredItems = items.filter(item => {
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
        .map(category => ({
          title: category.name,
          data: filteredItems.filter(item => item.categoryId === category.id),
        }))
        .filter(section => section.data.length > 0);
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

  return (
    <View style={tw`flex-1 p-4 mt-4 bg-white`}>
      {/* Search Bar */}
      <TextInput
        placeholder="Search Items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={tw`border border-black p-2 rounded mb-4`}
      />

      {/* Filter & Sort Buttons */}
      <View style={tw`flex-row justify-between mb-4`}>
        <TouchableOpacity
          style={tw`flex-1 mr-2 p-3 bg-black rounded`}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={tw`text-white text-center`}>Filter by Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-1 ml-2 p-3 bg-black rounded`}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={tw`text-white text-center`}>Sort Items</Text>
        </TouchableOpacity>
      </View>

      {/* Render SectionList or FlatList */}
      {sortOption && sortOption.field === 'category' ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ItemCard item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={tw`bg-black p-2 font-bold text-white`}>{title}</Text>
          )}
          ListEmptyComponent={
            <Text style={tw`text-black text-center`}>No items found.</Text>
          }
        />
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ItemCard item={item} />}
          ListEmptyComponent={
            <Text style={tw`text-black text-center`}>No items found.</Text>
          }
        />
      )}

{/* Filter Modal */}
<Modal
  visible={showFilterModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowFilterModal(false)}
>
  <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-60`}>
    <View style={tw`w-11/12 max-h-4/5 bg-white p-6 rounded-lg shadow-lg`}>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={tw`text-xl font-semibold text-gray-800`}>
          Filter by Categories
        </Text>
        <Pressable onPress={() => setShowFilterModal(false)}>
          <Text style={tw`text-gray-500 text-2xl`}>✕</Text>
        </Pressable>
      </View>
      <View style={tw`flex-row flex-wrap justify-start`}>
        {categories.length > 0 ? (
          categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => toggleCategoryFilter(category.id)}
              style={[
                tw`p-3 m-1 rounded-full border`,
                selectedCategories.includes(category.id)
                  ? tw`bg-black border-black`
                  : tw`bg-white border-gray-300`,
              ]}
            >
              <Text
                style={tw`${
                  selectedCategories.includes(category.id)
                    ? 'text-white'
                    : 'text-gray-800'
                }`}
              >
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
        style={tw`mt-6 p-3 bg-black rounded-lg`}
      >
        <Text style={tw`text-white text-center font-medium`}>Apply Filters</Text>
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
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`w-11/12 bg-white p-4 rounded`}>
            <Text style={tw`text-lg font-bold mb-4 text-black`}>Sort Items</Text>
            {sortOptions.map(option => (
              <Pressable
                key={option.label}
                onPress={() => {
                  setSortOption(option);
                  setShowSortModal(false);
                }}
                style={tw`p-2 border-b border-black`}
              >
                <Text style={tw`text-black`}>{option.label}</Text>
              </Pressable>
            ))}
            {sortOption && (
              <Pressable
                onPress={() => {
                  setSortOption(null);
                  setShowSortModal(false);
                }}
                style={tw`mt-4 p-2 bg-black rounded`}
              >
                <Text style={tw`text-white text-center`}>Clear Sorting</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
