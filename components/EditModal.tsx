import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from 'tailwind-react-native-classnames';
import { updateItem, updateCategory, fetchCategories } from '../lib/database';
import { ItemsContext } from '../lib/ItemsContext';
import { ThemeContext } from '../lib/ThemeContext';

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  type: 'item' | 'category';
  data: any;
  refresh: (updatedData: any) => void;
};

export default function EditModal({ visible, onClose, type, data, refresh }: EditModalProps) {
  const { theme, colorScheme } = useContext(ThemeContext);
  const { width: screenWidth } = useWindowDimensions();

  const [name, setName] = useState(data.name);
  const [price, setPrice] = useState(data.price?.toString() || '');
  const [imageUri, setImageUri] = useState(data.imageUri || '');
  const [categoryId, setCategoryId] = useState(data.categoryId || null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type === 'item') {
      fetchCategories().then(setCategories);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setName(data.name);
      setPrice(data.price?.toString() || '');
      setImageUri(data.imageUri || '');
      setCategoryId(data.categoryId || null);
    }
  }, [visible, data]);

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
    Alert.alert(
      'Confirm Save',
      'Are you sure you want to save the changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setLoading(true);
            if (!name.trim()) {
              Alert.alert('Error', 'Name cannot be empty.');
              setLoading(false);
              return;
            }

            let updatedData = { ...data, name: name.trim() };

            if (type === 'item') {
              if (!price.trim() || !categoryId) {
                Alert.alert('Error', 'Please fill all fields.');
                setLoading(false);
                return;
              }
              updatedData = {
                ...updatedData,
                price: parseFloat(price),
                imageUri,
                categoryId,
                categoryName: categories.find(cat => cat.id === categoryId)?.name || 'No Category'
              };
              refresh(updatedData);
              const success = await updateItem(data.id, name.trim(), parseFloat(price), imageUri, categoryId);
              if (success) {
                Alert.alert('Success', 'Item updated successfully!');
                onClose();
              } else {
                Alert.alert('Error', 'Failed to update item.');
              }
            } else {
              refresh(updatedData);
              const success = await updateCategory(data.id, name.trim());
              if (success) {
                Alert.alert('Success', 'Category updated successfully!');
                onClose();
              } else {
                Alert.alert('Error', 'Failed to update category.');
              }
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow justify-center items-center h-4/5`}>
          <View
            style={[
              tw`bg-white p-6 rounded-lg border-4 shadow-xl`,
              {
                width: screenWidth / 1.2, // Ensures modal width is always half the screen
                maxWidth: 400, // Prevents it from getting too large
                borderColor: colorScheme,
              },
            ]}
          >
            <Text style={tw`text-lg font-bold mb-4 text-black`}>
              Edit {type === 'item' ? 'Item' : 'Category'}
            </Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor="black"
              style={tw`border border-black p-2 rounded mb-4`}
              value={name}
              onChangeText={setName}
            />
            {type === 'item' && (
              <>
                <TextInput
                  placeholder="Price"
                  placeholderTextColor="black"
                  style={tw`border border-black p-2 rounded mb-4`}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
                <View style={tw`flex-row flex-wrap border border-black rounded mb-4 p-2`}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={tw`p-2 m-1 ${categoryId === cat.id ? `bg-${colorScheme}-500` : 'bg-white border border-black'}`}
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
                ) : (
                  <Image 
                    source={require('../assets/images/Placeholder.jpg')} 
                    style={tw`w-full h-40 rounded mb-4 border-2 border-black`} 
                  />
                )}
                <TouchableOpacity 
                  onPress={pickImage} 
                  style={tw`p-3 bg-${colorScheme}-500 rounded mb-4 shadow-md`}
                >
                  <Text style={tw`text-white text-center`}>Change Photo</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity 
                onPress={onClose} 
                style={tw`p-3 bg-${colorScheme}-500 rounded shadow-md flex-1 mr-2`}
              >
                <Text style={tw`text-white text-center`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave} 
                style={tw`p-3 bg-${colorScheme}-500 rounded shadow-md flex-1 ml-2`}
                disabled={loading}
              >
                <Text style={tw`text-white text-center`}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
