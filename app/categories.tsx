import React, { useEffect, useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import tw from 'tailwind-react-native-classnames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchItemsByCategory } from '@/lib/database'; // Import the function
import EditModal from '@/components/EditModal';
import { ThemeContext } from '@/lib/ThemeContext';
import { Animated } from 'react-native';

export default function Categories() {
  const [categories, setCategories] = useState<{ id: number; name: string, itemsCount: number }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colorScheme } = useContext(ThemeContext);

  // Load categories from AsyncStorage and fetch item count for each category
  const loadCategories = async () => {
    const storedCategories = await AsyncStorage.getItem('categories');
    const cats = storedCategories ? JSON.parse(storedCategories) : [];

    // For each category, fetch the item count using the `fetchItemsByCategory` function
    const categoriesWithItemsCount = await Promise.all(cats.map(async (cat: { id: number; name: string }) => {
      const items = await fetchItemsByCategory(cat.id);
      return {
        ...cat,
        itemsCount: items ? items.length : 0 // Ensure itemsCount is 0 if no items are found
      };
    }));

    // Now set the categories with the item count property
    setCategories(categoriesWithItemsCount);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Add new category after checking for duplicates
  const handleAddCategory = async () => {
    setLoading(true);
    const trimmedName = newCategory.trim();
    if (!trimmedName) return;

    // Prevent duplicate category names (case-insensitive)
    const duplicate = categories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      setLoading(false);
      return;
    }

    const tempId = -Date.now(); // Temporary ID
    const optimisticCategory = { id: tempId, name: trimmedName, itemsCount: 0 };
    setCategories(prev => [...prev, optimisticCategory]);
    setNewCategory('');

    const updatedCategories = [...categories, { id: Date.now(), name: trimmedName, itemsCount: 0 }];
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
    setLoading(false);
  };

  // Confirm before deleting a category
  const confirmDeleteCategory = (id: number) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCategory(id) },
      ]
    );
  };

  // Optimistically delete category
  const handleDeleteCategory = async (id: number) => {
    setLoading(true);
    const originalCategories = [...categories];
    const updatedCategories = originalCategories.filter(cat => cat.id !== id);
    setCategories(updatedCategories);
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    setLoading(false);
  };

  // Open the edit modal for a specific category
  const openEditModal = (category: { id: number; name: string }) => {
    setSelectedCategory(category);
    setEditModalVisible(true);
  };

  // Edit category after ensuring no duplicates are created
  const handleEditCategory = async (updatedCategory: { id: number; name: string }) => {
    const trimmedName = updatedCategory.name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Category name cannot be empty.');
      return;
    }
    // Prevent duplicate names when editing (ignoring the current category)
    const duplicate = categories.find(
      cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      return;
    }

    const newCat = { ...updatedCategory, name: trimmedName };
    const updatedCategories = categories.map(cat => (cat.id === newCat.id ? newCat : cat));
    setCategories(updatedCategories);
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-4 py-3 border-b border-black bg-white`}>
        <Text style={tw`text-2xl font-bold text-black`}>Manage Categories</Text>
      </View>

      {/* New Category */}
      <View style={tw`p-4 mt-5`}>
        <View style={tw`flex-row mb-4`}>
          <TextInput
            placeholder="New Category"
            placeholderTextColor="black"
            style={tw`flex-1 border border-black p-3 rounded-xl text-lg`}
            value={newCategory}
            onChangeText={setNewCategory}
            autoCapitalize="words"
          />
          <TouchableOpacity
            onPress={handleAddCategory}
            style={tw`ml-3 p-3 bg-${colorScheme}-500 rounded-xl justify-center`}
            disabled={loading}
          >
            <Text style={tw`text-white font-semibold text-lg`}>
              {loading ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Animated.View style={[tw`flex-row items-center justify-between p-3 border-b border-black`, { elevation: 2 }]}>
              <View style={tw`flex-1`}>
                <Text
                  style={tw`text-black text-lg font-medium`}
                  onPress={() => openEditModal(item)}
                >
                  {item.name}
                </Text>
                <Text style={tw`text-gray-500 text-sm`}>Items: {item.itemsCount}</Text>
              </View>

              <View style={tw`flex-row`}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={tw`p-3 bg-${colorScheme}-500 rounded-xl`}
                >
                  <Text style={tw`text-white`}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => confirmDeleteCategory(item.id)}
                  style={tw`p-3 bg-red-500 rounded-xl ml-2`}
                >
                  <Text style={tw`text-white`}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={<Text style={tw`text-black text-center mt-4`}>No categories found.</Text>}
        />
      </View>

      {/* Edit Modal */}
      {selectedCategory && (
        <EditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          type="category"
          data={selectedCategory}
          refresh={(updatedData: { id: number; name: string, itemsCount: number }) =>
            setCategories((prev) =>
              prev.map((cat) => (cat.id === updatedData.id ? updatedData : cat))
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
