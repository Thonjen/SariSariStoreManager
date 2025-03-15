import React, { useContext, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
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
    </View>
  );
};

export default ItemCard;
