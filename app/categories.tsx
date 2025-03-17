import React, { useEffect, useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { fetchCategories, insertCategory, deleteCategory, updateCategory } from '../lib/database';
import EditModal from '@/components/EditModal';
import { ThemeContext } from '@/lib/ThemeContext';

export default function Categories() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colorScheme } = useContext(ThemeContext);

  // Load categories from the database
  const loadCategories = async () => {
    const cats = await fetchCategories();
    setCategories(cats);
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
    const optimisticCategory = { id: tempId, name: trimmedName };
    setCategories(prev => [...prev, optimisticCategory]);
    setNewCategory('');

    const id = await insertCategory(trimmedName);
    if (id) {
      setCategories(prev =>
        prev.map(cat => (cat.id === tempId ? { ...cat, id } : cat))
      );
    } else {
      setCategories(prev => prev.filter(cat => cat.id !== tempId));
      Alert.alert('Error', 'Could not add category');
    }
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
    setCategories(prev => prev.filter(cat => cat.id !== id));

    try {
      await deleteCategory(id);
    } catch (error) {
      setCategories(originalCategories);
      Alert.alert('Error', 'Could not delete category');
    }
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
    setCategories(prev => prev.map(cat => (cat.id === newCat.id ? newCat : cat)));
    const success = await updateCategory(newCat.id, newCat.name);
    if (!success) {
      loadCategories();
      Alert.alert('Error', 'Failed to update category.');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-4 py-3 border-b border-black bg-white`}>
        <Text style={tw`text-2xl font-bold text-black`}>Manage Categories</Text>
      </View>
      <View style={tw`p-4 mt-5`}>
        <View style={tw`flex-row mb-4`}>
          <TextInput
            placeholder="New Category"
            placeholderTextColor="black"
            style={tw`flex-1 border border-black p-2 rounded`}
            value={newCategory}
            onChangeText={setNewCategory}
            autoCapitalize="words"
          />
          <TouchableOpacity onPress={handleAddCategory} style={tw`ml-2 p-2 bg-${colorScheme}-500 rounded justify-center`} disabled={loading}>
            <Text style={tw`text-white font-semibold`}>{loading ? 'Adding...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={tw`flex-row items-center justify-between p-2 border-b border-black`}>
              <Text style={tw`text-black flex-1`} onPress={() => openEditModal(item)}>
                {item.name}
              </Text>
              <View style={tw`flex-row`}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={tw`p-2 bg-${colorScheme}-500 rounded `}>
                  <Text style={tw`text-white`}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDeleteCategory(item.id)} style={tw`p-2 bg-red-500 rounded ml-2`}>
                  <Text style={tw`text-white`}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={tw`text-black text-center mt-4`}>No categories found.</Text>}
        />
      </View>

      {/* Edit Modal rendered at screen level */}
      {selectedCategory && (
        <EditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          type="category"
          data={selectedCategory}
          refresh={(updatedData: { id: number; name: string }) =>
            setCategories((prev) => prev.map((cat) => (cat.id === updatedData.id ? updatedData : cat)))
          }
        />
      )}
    </SafeAreaView>
  );
}
