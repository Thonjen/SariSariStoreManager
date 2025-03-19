import tw from 'tailwind-react-native-classnames';
import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, TextInput, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { insertItem, fetchCategories } from '../lib/database';
import { ItemsContext } from '../lib/ItemsContext';
import { ThemeContext } from '../lib/ThemeContext';


// Define Props Type
type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
};

const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose }) => {
  const { updateItems } = useContext(ItemsContext);
  const { theme, colorScheme } = useContext(ThemeContext);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const fetchedCategories = await fetchCategories();
    setCategories(fetchedCategories);
    if (fetchedCategories.length > 0) {
      setCategoryId(fetchedCategories[0].id);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'You need to allow camera access.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync()
      : await ImagePicker.launchImageLibraryAsync();

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !categoryId) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    const existingItems = await AsyncStorage.getItem('items');
    const items = existingItems ? JSON.parse(existingItems) : [];

    if (items.some((item: { name: string }) => item.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate Item', 'An item with this name already exists.');
      return;
    }

    setLoading(true);
    const newItemId = await insertItem(name, parseFloat(price), imageUri ?? '', categoryId);
    if (newItemId) {
      updateItems();
      onClose();
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={[tw`w-80 p-5 rounded-lg bg-${colorScheme}-500`]}>
          <Text style={[tw`text-lg font-bold mb-4 text-black`]}>Add New Item</Text>
          <TextInput
            placeholder="Item Name"
            value={name}
            onChangeText={setName}
            style={[tw`border-b mb-3 p-2 text-black`]}
          />
          <TextInput
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={[tw`border-b mb-3 p-2 text-black`]}
          />
          <RNPickerSelect
            onValueChange={setCategoryId}
            items={categories.map(cat => ({ label: cat.name, value: cat.id }))}
            value={categoryId}
          />
          {imageUri && <Image source={{ uri: imageUri }} style={tw`w-24 h-24 mt-3 self-center`} />}
          <View style={tw`mt-3`}>
            <Button title="Pick Image from Gallery" onPress={() => pickImage(false)} />
            <Button title="Take a Picture" onPress={() => pickImage(true)} />
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={colorScheme} />
          ) : (
            <Button title="Save Item" onPress={handleSave} />
          )}
          <Button title="Cancel" color="red" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

export default AddItemModal;
