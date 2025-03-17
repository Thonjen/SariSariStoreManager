import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import tw from 'tailwind-react-native-classnames';
import RNPickerSelect from 'react-native-picker-select';
import { insertItem, fetchCategories } from '../lib/database';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';
import { ThemeContext } from '@/lib/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CategoryType = {
  id: number;
  name: string;
};

export default function AddItem() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState('');
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { items, setItems } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const cats: CategoryType[] = await fetchCategories();
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    };
    loadCategories();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    if (!name || !price || !categoryId) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Prevent duplicate item names (case-insensitive)
    const storedItems = await AsyncStorage.getItem('items');
    const items: ItemType[] = storedItems ? JSON.parse(storedItems) : [];
    
    if (items.find((item: ItemType) => item.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      Alert.alert('Duplicate Item', 'An item with this name already exists.');
      setLoading(false);
      return;
    }
    

    const tempId = Date.now();
    const newItem: ItemType = {
      id: tempId,
      name,
      price: parseFloat(price),
      imageUri,
      categoryId,
    };

    const updatedItems = [newItem, ...items];
    await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
    setItems(updatedItems);

    const insertedId = await insertItem(name, parseFloat(price), imageUri, categoryId);
    if (insertedId) {
      const finalItems = updatedItems.map(item => (item.id === tempId ? { ...item, id: insertedId } : item));
      await AsyncStorage.setItem('items', JSON.stringify(finalItems));
      setItems(finalItems);
      Alert.alert('Success', 'Item added successfully');
      // Reset all fields after successful insertion
      setName('');
      setPrice('');
      setCategoryId(categories.length > 0 ? categories[0].id : null);
      setImageUri('');
      router.back();
    } else {
      const revertedItems = updatedItems.filter(item => item.id !== tempId);
      await AsyncStorage.setItem('items', JSON.stringify(revertedItems));
      setItems(revertedItems);
      Alert.alert('Error', 'There was a problem adding the item.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
            {/* Header */}
      <View style={tw`px-4 py-3 border-b border-black bg-white`}>
        <Text style={tw`text-2xl font-bold text-black`}>Add Item</Text>
      </View>
      <View style={tw`p-4`}>
        <TextInput
          placeholder="Item Name"
          placeholderTextColor="black"
          style={tw`border border-black p-2 rounded mb-4`}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          placeholder="Price"
          placeholderTextColor="black"
          style={tw`border border-black p-2 rounded mb-4`}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {/* Category Picker */}
        <View style={tw`border border-black rounded mb-4 p-2`}>
          <RNPickerSelect
            onValueChange={(value) => setCategoryId(value)}
            items={categories.map(cat => ({
              label: cat.name,
              value: cat.id,
            }))}
            value={categoryId}
            placeholder={{ label: 'Select a category', value: null }}
            style={{
              inputIOS: { color: 'black' },
              inputAndroid: { color: 'black' },
            }}
          />
        </View>

        {/* Image Picker */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={tw`w-full h-40 rounded mb-4`} />
        ) : (
          <Image source={require('../assets/images/Placeholder.jpg')} style={tw`w-full h-40 rounded mb-4`} />
        )}
        <View style={tw`flex-row justify-between mb-4`}>
          <TouchableOpacity onPress={takePhoto} style={tw`p-3 bg-${colorScheme}-500 rounded`}>
            <Text style={tw`text-white`}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={tw`p-3 bg-${colorScheme}-500 rounded`}>
            <Text style={tw`text-white`}>Choose Photo</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSave} style={tw`p-3 bg-${colorScheme}-500 rounded`} disabled={loading}>
          <Text style={tw`text-white text-center`}>{loading ? 'Saving...' : 'Save Item'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
