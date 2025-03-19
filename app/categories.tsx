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
import EditModal from '@/components/EditModal';
import { ThemeContext } from '@/lib/ThemeContext';
import { Animated } from 'react-native';

// Define category type
interface Category {
  id: number;
  name: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colorScheme } = useContext(ThemeContext);

  // Load categories
  const loadCategories = async () => {
    setLoading(true);
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      const cats: Category[] = storedCategories ? JSON.parse(storedCategories) : [];
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Add new category
  const handleAddCategory = async () => {
    const trimmedName = newCategory.trim();
    if (!trimmedName) return;
  
    const duplicate = categories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      return;
    }
  
    Alert.alert(
      'Confirm Addition',
      `Are you sure you want to add "${trimmedName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            setLoading(true);
            const newCat: Category = { id: Date.now(), name: trimmedName };
            const updatedCategories = [...categories, newCat];
  
            await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
            setCategories(updatedCategories);
            setNewCategory('');
            setLoading(false);
          }
        }
      ]
    );
  };
  

  // Delete category with confirmation
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

  // Delete category
  const handleDeleteCategory = async (id: number) => {
    setLoading(true);
    const updatedCategories = categories.filter(cat => cat.id !== id);
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
    setLoading(false);
  };

  // Open edit modal
  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setEditModalVisible(true);
  };

  // Edit category
  const handleEditCategory = async (updatedCategory: Category) => {
    const trimmedName = updatedCategory.name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Category name cannot be empty.');
      return;
    }

    const duplicate = categories.find(
      cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      Alert.alert('Duplicate Category', 'This category already exists.');
      return;
    }

    const newCat = { ...updatedCategory, name: trimmedName };
    const updatedCategories = categories.map(cat => (cat.id === newCat.id ? newCat : cat));
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
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

        {loading ? (
          <ActivityIndicator size="large" color={tw.color(`${colorScheme}-500`)} />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }: { item: Category }) => (
              <Animated.View style={[tw`flex-row items-center justify-between p-4 mb-4 bg-white border-b border-gray-200 shadow-sm rounded-xl`]}>
                <Text
                  style={tw`text-black text-lg font-medium`}
                  onPress={() => openEditModal(item)}
                >
                  {item.name}
                </Text>
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
        )}
      </View>

      {/* Edit Modal */}
      {selectedCategory && (
        <EditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          type="category"
          data={selectedCategory}
          refresh={(updatedData) => {
            setCategories((prev) => prev.map((cat) => (cat.id === updatedData.id ? updatedData : cat)));
          }}
        />
      )}
    </SafeAreaView>
  );
}