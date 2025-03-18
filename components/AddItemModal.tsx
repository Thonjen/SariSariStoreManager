import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';
import { ThemeContext } from '@/lib/ThemeContext';
import tw from 'tailwind-react-native-classnames';

type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AddItemModal({ visible, onClose }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { items, setItems } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);

  useEffect(() => {
    const loadCategories = async () => {
      const storedCategories = await AsyncStorage.getItem('categories');
      const cats = storedCategories ? JSON.parse(storedCategories) : [];
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    };
    loadCategories();
  }, []);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated here
        allowsEditing: true,
        quality: 0.5,
      });
  
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'There was an error picking the image.');
    }
  };
  
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
        return;
      }
  
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], // Updated here
        allowsEditing: true,
        quality: 0.5,
      });
  
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'There was an error taking the photo.');
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    if (!name || !price || !categoryId) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      setLoading(false);
      return;
    }
    const storedItems = await AsyncStorage.getItem('items');
    const existingItems: ItemType[] = storedItems ? JSON.parse(storedItems) : [];
    if (existingItems.some((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      Alert.alert('Duplicate Item', 'An item with this name already exists.');
      setLoading(false);
      return;
    }
    const newItem: ItemType = { id: Date.now(), name, price: parseFloat(price), imageUri, categoryId };
    const updatedItems = [newItem, ...existingItems];
    await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
    setItems(updatedItems);
    Alert.alert('Success', 'Item added successfully');
    onClose();
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white w-11/12 p-5 rounded-lg shadow-lg border-${colorScheme}-500 border-2`}>
          <Text style={tw`text-xl font-bold mb-4 text-${colorScheme}-500`}>Add New Item</Text>
          <TextInput
            placeholder="Item Name"
            value={name}
            onChangeText={setName}
            style={tw`border p-2 rounded mb-3 border-${colorScheme}-500`}
          />
          <TextInput
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={tw`border p-2 rounded mb-3 border-${colorScheme}-500`}
          />
          <View style={tw`border rounded mb-3 p-2 border-${colorScheme}-500`}>
            <RNPickerSelect
              onValueChange={setCategoryId}
              items={categories.map(cat => ({ label: cat.name, value: cat.id }))}
              value={categoryId}
              placeholder={{ label: 'Select a category', value: null }}
            />
          </View>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={tw`w-full h-32 rounded mb-3`} />
          ) : null}
          <View style={tw`flex-row justify-between mb-3`}>
            <TouchableOpacity onPress={takePhoto} style={tw`p-2 bg-${colorScheme}-500 rounded`}>
              <Text style={tw`text-white text-center`}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={tw`p-2 bg-${colorScheme}-500 rounded`}>
              <Text style={tw`text-white text-center`}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity onPress={onClose} style={tw`p-2 bg-gray-500 rounded w-1/3`}>
              <Text style={tw`text-white text-center`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={tw`p-2 bg-${colorScheme}-500 rounded w-1/3`} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={tw`text-white text-center`}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}