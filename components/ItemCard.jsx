import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemsContext } from '../lib/ItemsContext';
import { ThemeContext } from '../lib/ThemeContext';

const ItemCard = ({ item, onEdit }) => {
  const { items, setItems } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState('No Category');

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const storedCategories = await AsyncStorage.getItem('categories');
        if (storedCategories) {
          const categories = JSON.parse(storedCategories);
          const category = categories.find((cat) => cat.id === item.categoryId);
          setCategoryName(category ? category.name : 'No Category');
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };

    fetchCategory();
  }, [item.categoryId]);

  const handleDelete = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            // Remove item from items list
            const updatedItems = items.filter((i) => i.id !== item.id);
            setItems(updatedItems);
            await AsyncStorage.setItem('items', JSON.stringify(updatedItems));

            // Add to recently deleted
            const storedDeleted = JSON.parse(await AsyncStorage.getItem('recentlyDeleted')) || [];
            const updatedDeleted = [...storedDeleted, item];
            await AsyncStorage.setItem('recentlyDeleted', JSON.stringify(updatedDeleted));
          } catch (error) {
            console.error('Error deleting item:', error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={tw`w-1/2 p-2`}>
      <TouchableOpacity onPress={() => setViewModalVisible(true)} style={tw`rounded-xl overflow-hidden shadow-lg`}>
        <Image
          source={item.imageUri ? { uri: item.imageUri } : require('../assets/images/Placeholder.jpg')}
          style={tw`w-full h-48`}
        />
        {/* Overlay with Text */}
        <View style={tw`absolute bottom-0 w-full bg-black bg-opacity-60 p-2 rounded-b-xl`}>
          <Text style={tw`text-white font-semibold text-sm`} numberOfLines={1}>{item.name}</Text>
          <Text style={tw`text-gray-300 text-sm font-bold`}>₱{item.price}</Text>
          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="category" size={14} color="white" />
            <Text style={tw`text-gray-300 text-xs ml-1`} numberOfLines={1}>{categoryName}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={tw`flex-row justify-between mt-2`}>
        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={tw`p-2 rounded-lg bg-${colorScheme}-500 flex-1 mr-1 items-center`}
        >
          <MaterialIcons name="edit" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={tw`p-2 rounded-lg bg-red-500 flex-1 ml-1 items-center`}
          disabled={loading}
        >
          <MaterialIcons name="delete" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* View Modal */}
      <Modal
        visible={viewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white rounded-lg p-4 w-11/12 max-w-md`}>
            <Pressable onPress={() => setViewModalVisible(false)} style={tw`absolute top-2 right-2`}>
              <MaterialIcons name="close" size={24} color="gray" />
            </Pressable>
            <View style={tw`items-center`}>
              <Image
                source={item.imageUri ? { uri: item.imageUri } : require('../assets/images/Placeholder.jpg')}
                style={tw`w-64 h-64 rounded-lg`}
              />
              <Text style={tw`text-lg font-bold mt-2`}>{item.name}</Text>
              <Text style={tw`text-base text-gray-700`}>₱{item.price}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                <MaterialIcons name="category" size={16} color="gray" />
                <Text style={tw`ml-1 text-sm text-gray-600`}>{categoryName}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ItemCard;
