import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { fetchCategories, insertCategory, deleteCategory, updateCategory } from '../lib/database';
import EditModal from '@/components/EditModal';

export default function Categories() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);

  // Load categories from the database
  const loadCategories = async () => {
    const cats = await fetchCategories();
    setCategories(cats);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Optimistic add category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const tempId = -Date.now(); // Temporary ID
    const optimisticCategory = { id: tempId, name: newCategory.trim() };
    setCategories((prev) => [...prev, optimisticCategory]);
    setNewCategory('');

    const id = await insertCategory(newCategory.trim());
    if (id) {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === tempId ? { ...cat, id } : cat))
      );
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== tempId));
      Alert.alert('Error', 'Could not add category');
    }
  };

  // Show confirmation before deleting
  const confirmDeleteCategory = (id: number) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCategory(id) }
      ]
    );
  };

  // Optimistic delete category
  const handleDeleteCategory = async (id: number) => {
    const originalCategories = [...categories];
    setCategories((prev) => prev.filter((cat) => cat.id !== id));

    try {
      await deleteCategory(id);
    } catch (error) {
      setCategories(originalCategories);
      Alert.alert('Error', 'Could not delete category');
    }
  };

  // Optimistic edit category
  const handleEditCategory = async (updatedCategory: { id: number; name: string }) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
    );
    const success = await updateCategory(updatedCategory.id, updatedCategory.name);
    if (!success) {
      loadCategories();
      Alert.alert('Error', 'Failed to update category.');
    }
  };

  return (
    <View style={tw`flex-1 p-4 mt-5 bg-white`}>
      <Text style={tw`text-black text-xl font-bold mb-4`}>Manage Categories</Text>
      
      <View style={tw`flex-row mb-4`}>
        <TextInput
          placeholder="New Category"
          style={tw`flex-1 border border-black p-2 rounded`}
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <TouchableOpacity onPress={handleAddCategory} style={tw`ml-2 p-2 bg-black rounded`}>
          <Text style={tw`text-white`}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={tw`flex-row items-center justify-between p-2 border-b border-black`}>
            <Text style={tw`text-black flex-1`} onPress={() => setEditingCategory(item)}>
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => confirmDeleteCategory(item.id)} style={tw`p-2 bg-black rounded`}>
              <Text style={tw`text-white`}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingCategory(item)} style={tw`p-2 bg-black rounded ml-2`}>
              <Text style={tw`text-white`}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={tw`text-black text-center`}>No categories found.</Text>}
      />

      {editingCategory && (
        <EditModal
          visible={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          type="category"
          data={editingCategory}
          refresh={(updatedData: { id: number; name: string }) => handleEditCategory(updatedData)}
        />
      )}
    </View>
  );
}
