import React, { useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { useRouter } from 'expo-router';
import { deleteItem } from '../lib/database';
import EditModal from './EditModal';
import { ItemsContext } from '../lib/ItemsContext';

const ItemCard = ({ item }) => {
  const router = useRouter();
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const { items, setItems } = useContext(ItemsContext);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Save a copy of the original items in case we need to roll back.
            const originalItems = [...items];
            // Optimistically remove the item from the state.
            setItems(originalItems.filter((i) => i.id !== item.id));
            try {
              await deleteItem(item.id);
            } catch (error) {
              // Roll back the change if deletion fails.
              setItems(originalItems);
              Alert.alert('Error', 'Could not delete item.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={tw`flex-row items-center p-4 border-2 border-black rounded mb-2 bg-white shadow-lg`}>
        {item.imageUri ? (
          <Image 
            source={{ uri: item.imageUri }} 
            style={tw`w-16 h-16 rounded mr-4 border-2 border-black`} 
          />
        ) : (
          <View style={tw`w-16 h-16 bg-white border border-black rounded mr-4`} />
        )}
        <View style={tw`flex-1`}>
          <Text style={tw`text-black font-bold`}>{item.name}</Text>
          <Text style={tw`text-black`}>₱{item.price}</Text>
          <Text style={tw`text-black`}>
            {item.categoryName ? item.categoryName : 'No Category'}
          </Text>
        </View>
        <View style={tw`flex-row`}>
          <TouchableOpacity 
            onPress={() => setEditModalVisible(true)} 
            style={tw`p-2 bg-black rounded mr-2 shadow-md`}
          >
            <Text style={tw`text-white`}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleDelete} 
            style={tw`p-2 bg-black rounded shadow-md`}
          >
            <Text style={tw`text-white`}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Modal with an optimistic update callback */}
      <EditModal 
        visible={isEditModalVisible} 
        onClose={() => setEditModalVisible(false)} 
        type="item" 
        data={item} 
        refresh={(updatedItem) => {
          // Immediately update the item in the context.
          setItems((prev) =>
            prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
          );
        }} 
      />
    </>
  );
};

export default ItemCard;
