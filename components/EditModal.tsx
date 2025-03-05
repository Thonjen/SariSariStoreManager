// EditModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from 'tailwind-react-native-classnames';
import { updateItem, updateCategory, fetchCategories } from '../lib/database';

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  type: 'item' | 'category';
  data: any;
  // refresh callback now receives an updated item (for optimistic update)
  refresh: (updatedData: any) => void;
};

export default function EditModal({ visible, onClose, type, data, refresh }: EditModalProps) {
  const [name, setName] = useState(data.name);
  const [price, setPrice] = useState(data.price?.toString() || '');
  const [imageUri, setImageUri] = useState(data.imageUri || '');
  const [categoryId, setCategoryId] = useState(data.categoryId || null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  React.useEffect(() => {
    if (type === 'item') {
      fetchCategories().then(setCategories);
    }
  }, [visible]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    let updatedData = { ...data, name: name.trim() };

    if (type === 'item') {
      if (!price.trim() || !categoryId) {
        Alert.alert('Error', 'Please fill all fields.');
        return;
      }
      updatedData = {
        ...updatedData,
        price: parseFloat(price),
        imageUri,
        categoryId,
      };
      // Optimistically update the parent state before awaiting database update.
      refresh(updatedData);
      const success = await updateItem(data.id, name.trim(), parseFloat(price), imageUri, categoryId);
      if (success) {
        Alert.alert('Success', 'Item updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update item.');
        // Optionally, revert the optimistic update if needed.
      }
    } else {
      // For categories
      refresh(updatedData);
      const success = await updateCategory(data.id, name.trim());
      if (success) {
        Alert.alert('Success', 'Category updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update category.');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={tw`absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white p-6 rounded-lg w-11/12 border-4 border-black shadow-xl`}>
          <Text style={tw`text-lg font-bold mb-4 text-black`}>
            Edit {type === 'item' ? 'Item' : 'Category'}
          </Text>
          <TextInput
            placeholder="Name"
            style={tw`border border-black p-2 rounded mb-4`}
            value={name}
            onChangeText={setName}
          />
          {type === 'item' && (
            <>
              <TextInput
                placeholder="Price"
                style={tw`border border-black p-2 rounded mb-4`}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
              <View style={tw`flex-row flex-wrap border border-black rounded mb-4`}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={tw`p-2 m-1 ${categoryId === cat.id ? 'bg-black' : 'bg-white border border-black'}`}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={tw`${categoryId === cat.id ? 'text-white' : 'text-black'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {imageUri ? (
                <Image 
                  source={{ uri: imageUri }} 
                  style={tw`w-full h-40 rounded mb-4 border-2 border-black`} 
                />
              ) : null}
              <TouchableOpacity 
                onPress={pickImage} 
                style={tw`p-3 bg-black rounded mb-4 shadow-md`}
              >
                <Text style={tw`text-white text-center`}>Change Photo</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity 
              onPress={onClose} 
              style={tw`p-3 bg-black rounded shadow-md flex-1 mr-2`}
            >
              <Text style={tw`text-white text-center`}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              style={tw`p-3 bg-black rounded shadow-md flex-1 ml-2`}
            >
              <Text style={tw`text-white text-center`}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
