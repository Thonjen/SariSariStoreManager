import React, { useContext, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { useRouter } from 'expo-router';
import { deleteItem } from '../lib/database';
import { ItemsContext } from '../lib/ItemsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../lib/ThemeContext';

const ItemCard = ({ item, onEdit }) => {
  const router = useRouter();
  const { items, setItems } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const originalItems = [...items];
            setItems(originalItems.filter((i) => i.id !== item.id));
            try {
              await deleteItem(item.id);
            } catch {
              setItems(originalItems);
              Alert.alert('Error', 'Could not delete item.');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <View style={tw`flex-row items-center p-3 border border-gray-300 rounded-lg bg-white mb-4 shadow-lg`}>
      {/* Wrap the image in TouchableOpacity to trigger the view modal */}
      <TouchableOpacity onPress={() => setViewModalVisible(true)}>
        {item.imageUri ? (
          <Image 
            source={{ uri: item.imageUri }} 
            style={tw`w-24 h-24 rounded-lg mr-4 border border-gray-300`} 
          />
        ) : (
          <Image 
            source={require('../assets/images/Placeholder.jpg')} 
            style={tw`w-24 h-24 rounded-lg mr-4 border border-gray-300`} 
          />
        )}
      </TouchableOpacity>

      <View style={tw`flex-1`}>
        <Text style={tw`text-black font-semibold text-base`}>{item.name}</Text>
        <Text style={tw`text-gray-600 text-lg font-bold`}>₱{item.price}</Text>
        <View style={tw`flex-row items-center mt-1`}>
          <MaterialIcons name="category" size={16} color="gray" />
          <Text style={tw`text-gray-600 ml-1 text-xs`}>{item.categoryName || 'No Category'}</Text>
        </View>
      </View>

      <View style={tw`flex-row items-center`}>
        <TouchableOpacity 
          onPress={() => onEdit(item)} 
          style={tw`p-2 rounded-full bg-${colorScheme}-500 mr-2`}
        >
          <MaterialIcons name="edit" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleDelete} 
          style={tw`p-2 rounded-full bg-red-500`}
          disabled={loading}
        >
          <MaterialIcons name="delete" size={20} color="white" />
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
            {/* Close Button */}
            <Pressable 
              onPress={() => setViewModalVisible(false)}
              style={tw`absolute top-2 right-2`}
            >
              <MaterialIcons name="close" size={24} color="gray" />
            </Pressable>
            <View style={tw`items-center`}>
              {item.imageUri ? (
                <Image 
                  source={{ uri: item.imageUri }} 
                  style={tw`w-64 h-64 rounded-lg`} 
                />
              ) : (
                <Image 
                  source={require('../assets/images/Placeholder.jpg')} 
                  style={tw`w-64 h-64 rounded-lg`} 
                />
              )}
              <Text style={tw`text-lg font-bold mt-2`}>{item.name}</Text>
              <Text style={tw`text-base text-gray-700`}>₱{item.price}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                <MaterialIcons name="category" size={16} color="gray" />
                <Text style={tw`ml-1 text-sm text-gray-600`}>{item.categoryName || 'No Category'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ItemCard;
