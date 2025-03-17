import React, { useContext, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { ItemsContext, ItemType } from '@/lib/ItemsContext';
import { ThemeContext } from '@/lib/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

type POSScreenProps = {
  visible: boolean;
  onClose: () => void;
};

export default function POSScreen({ visible, onClose }: POSScreenProps) {

  const { items } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ item: ItemType; quantity: number }[]>([]);
  const [receivedAmount, setReceivedAmount] = useState('');
  
  // Filter items based on search query
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, items]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return cart.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);
  }, [cart]);

  const changeDue = useMemo(() => {
    return receivedAmount ? parseFloat(receivedAmount) - totalPrice : 0;
  }, [receivedAmount, totalPrice]);

  const addItemToCart = (item: ItemType) => {
    setCart((prevCart) => {
      const existing = prevCart.find((cartItem) => cartItem.item.id === item.id);
      if (existing) {
        return prevCart.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { item, quantity: 1 }];
    });
  };

  const removeItemFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((cartItem) => cartItem.item.id !== id));
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100 p-4`}>      
      <TextInput
        placeholder="Search items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={tw`bg-white border px-4 py-2 rounded mb-4`}
      />
      
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => addItemToCart(item)}
            style={tw`bg-white p-4 mb-2 rounded shadow`}
          >
            <Text style={tw`text-lg font-semibold`}>{item.name}</Text>
            <Text style={tw`text-gray-600`}>₱{item.price.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />
      
      <View style={tw`mt-4 p-4 bg-white rounded shadow`}>
        <Text style={tw`text-xl font-bold mb-2`}>Cart</Text>
        {cart.map(({ item, quantity }) => (
          <View key={item.id} style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-lg`}>{item.name} x{quantity}</Text>
            <TouchableOpacity onPress={() => removeItemFromCart(item.id)}>
              <MaterialIcons name="delete" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ))}
        <Text style={tw`text-lg font-bold`}>Total: ₱{totalPrice.toFixed(2)}</Text>
      </View>
      
      <View style={tw`mt-4 p-4 bg-white rounded shadow`}>
        <Text style={tw`text-lg font-bold mb-2`}>Payment</Text>
        <TextInput
          placeholder="Enter received amount"
          keyboardType="numeric"
          value={receivedAmount}
          onChangeText={setReceivedAmount}
          style={tw`bg-gray-100 border px-4 py-2 rounded mb-2`}
        />
        <Text style={tw`text-lg font-bold`}>Change: ₱{changeDue.toFixed(2)}</Text>
      </View>
    </SafeAreaView>
  );
}
