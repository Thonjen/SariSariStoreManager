import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import tw from 'tailwind-react-native-classnames';
import RNPickerSelect from 'react-native-picker-select';
import { insertItem, fetchCategories } from '../lib/database';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';

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
  const router = useRouter();
  const { setItems } = useContext(ItemsContext);

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
  }, [categories]); // ✅ Re-fetch when categories update

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
      Alert.alert('Permission required', 'Camera access is needed to take a photo.');
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
    if (!name || !price || !categoryId) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
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

    setItems((prevItems) => [newItem, ...prevItems]);

    const insertedId = await insertItem(name, parseFloat(price), imageUri, categoryId);
    if (insertedId) {
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === tempId ? { ...item, id: insertedId } : item))
      );
      Alert.alert('Success', 'Item added successfully');
      router.back();
    } else {
      setItems((prevItems) => prevItems.filter((item) => item.id !== tempId));
      Alert.alert('Error', 'There was a problem adding the item.');
    }
  };

  return (
    <View style={tw`flex-1 p-4 bg-white`}>
      <Text style={tw`text-black text-xl font-bold mb-4`}>Add New Item</Text>
      <TextInput
        placeholder="Item Name"
        style={tw`border border-black p-2 rounded mb-4`}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Price"
        style={tw`border border-black p-2 rounded mb-4`}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      {/* Category Picker */}
      <View style={tw`border border-black rounded mb-4 p-2`}>
        <RNPickerSelect
          onValueChange={(value) => setCategoryId(value)}
          items={categories.map((cat) => ({
            label: cat.name,
            value: cat.id,
          }))}
          value={categoryId}
          placeholder={{ label: 'Select a category', value: null }}
        />
      </View>

      {/* Image Picker */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={tw`w-full h-40 rounded mb-4`} />
      ) : null}
      <View style={tw`flex-row justify-between mb-4`}>
        <TouchableOpacity onPress={takePhoto} style={tw`p-3 bg-black rounded`}>
          <Text style={tw`text-white`}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={tw`p-3 bg-black rounded`}>
          <Text style={tw`text-white`}>Choose Photo</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleSave} style={tw`p-3 bg-black rounded`}>
        <Text style={tw`text-white text-center`}>Save Item</Text>
      </TouchableOpacity>
    </View>
  );
}
