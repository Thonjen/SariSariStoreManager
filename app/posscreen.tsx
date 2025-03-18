import { useState, useContext,useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchItems, fetchCategories } from "@/lib/database";
import { useRouter } from "expo-router";
import tw from "tailwind-react-native-classnames";
import { ThemeContext } from '@/lib/ThemeContext';



interface Item {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUri?: string;
}
interface Category {
  id: number;
  name: string;
}

export default function POSScreen() {
  const { colorScheme, setColorScheme } = useContext(ThemeContext); // Get current color scheme and setter function
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<{ item: Item; quantity: number }[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const router = useRouter();

  const colorSchemes = [
    { name: 'Blue', primary: 'blue' },
    { name: 'Green', primary: 'green' },
    { name: 'Red', primary: 'red' },
    { name: 'Purple', primary: 'purple' },
  ];


  // Modal states and payment-related states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      const fetchedItems = await fetchItems();
      const fetchedCategories = await fetchCategories();
      setItems(fetchedItems);
      setCategories(fetchedCategories);

      // Load cart from storage
      const storedCart = await AsyncStorage.getItem("cart");
      if (storedCart) setCart(JSON.parse(storedCart));

      // Load past transactions
      const storedTransactions = await AsyncStorage.getItem("transactions");
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    };
    loadItems();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.item.id === item.id
      );
      return existingItem
        ? prevCart.map((cartItem) =>
            cartItem.item.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...prevCart, { item, quantity: 1 }];
    });
  };

  const increaseQuantity = (itemId: number) => {
    setCart((prevCart) =>
      prevCart.map((cartItem) =>
        cartItem.item.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    );
  };

  const decreaseQuantity = (itemId: number) => {
    setCart((prevCart) =>
      prevCart
        .map((cartItem) =>
          cartItem.item.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  const totalAmount = cart.reduce(
    (sum, cartItem) => sum + cartItem.item.price * cartItem.quantity,
    0
  );

  // Filter items based on search & selected category
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategory === null || item.categoryId === selectedCategory)
  );

  // Function to handle payment confirmation
  const handlePayment = async () => {
    const cash = parseFloat(cashInput);
    if (isNaN(cash) || cash < totalAmount) {
      setError("Insufficient payment. Please provide enough cash.");
      return;
    }
    const change = cash - totalAmount;
  
    const newTransaction = {
      date: new Date().toISOString(), // ISO format for proper sorting
      total: totalAmount,
      payment: cash, // Cash received
      change: change, // Change given
      items: cart,
    };
  
    const updatedTransactions = [newTransaction, ...transactions].slice(0, 5);
    setTransactions(updatedTransactions);
    await AsyncStorage.setItem("transactions", JSON.stringify(updatedTransactions));
  
    // Clear the cart after successful payment
    setCart([]);
    await AsyncStorage.removeItem("cart");
  
    setShowPaymentModal(false);
    setCashInput("");
    setError("");
  
    Alert.alert("Payment Successful", `Change: ₱${change.toFixed(2)}`);
  };
  

  return (
    <View style={tw`flex-1 p-4 bg-gray-100`}>
<View style={tw`p-1`}>
  {/* Search Bar */}
  <View style={tw`mb-2 p-2 bg-gray-100 rounded-lg shadow-md`}>
    <TextInput
      style={tw`p-1 bg-transparent text-base`}
      placeholder="🔍 Search items..."
      value={search}
      onChangeText={setSearch}
    />
  </View>

  {/* Categories */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={tw`h-12`} // Keeps height consistent
    contentContainerStyle={tw`flex-row items-center`}
  >
    <TouchableOpacity
      style={[
        tw`px-6 py-2 rounded-full mr-2`,
        selectedCategory === null ? tw`bg-${colorScheme}-500` : tw`bg-gray-300`,
      ]}
      onPress={() => setSelectedCategory(null)}
    >
      <Text style={tw`text-white font-semibold`}>All</Text>
    </TouchableOpacity>
    {categories.map((category) => (
      <TouchableOpacity
        key={category.id}
        style={[
          tw`px-6 py-2 rounded-full mr-2`,
          selectedCategory === category.id ? tw`bg-${colorScheme}-300` : tw`bg-gray-300`,
        ]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <Text style={tw`text-white font-semibold`}>{category.name}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>






      {/* Items Grid or No Items View */}
      {filteredItems.length > 0 ? (
        <FlatList
        data={filteredItems}
        key="grid"
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`w-1/3 p-2 bg-white rounded-lg shadow-lg items-center`} // No need for mr-2 or mb-4
            onPress={() => addToCart(item)}
          >
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={tw`w-24 h-24 rounded-lg mb-2`}
                resizeMode="cover"
              />
            ) : (
              <View
                style={tw`w-24 h-24 bg-gray-300 rounded-lg mb-2 items-center justify-center`}
              >
                <Text style={tw`text-gray-500 text-sm`}>No Image</Text>
              </View>
            )}
            <Text style={tw`text-center font-semibold text-sm`}>
              {item.name}
            </Text>
            <Text style={tw`text-${colorScheme}-500 font-bold text-sm`}>
              ₱{item.price.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      />
      
      ) : (
        <View style={tw`flex-1 items-center justify-center my-10`}>
          {/* Replace './assets/logo.png' with your app logo path */}
          <Image
            source={require("../assets/images/icon.png")}
            style={tw`w-24 h-24`}
            resizeMode="contain"
          />
          <Text style={tw`mt-4 text-lg font-bold`}>No items available</Text>
        </View>
      )}

      {/* Cart Section */}
      <View style={tw`p-4 mt-2 bg-white rounded-xl shadow-lg max-h-60`}>
        <Text style={tw`text-lg font-bold mb-2`}>🛒 Cart</Text>
        <ScrollView style={tw`max-h-40`}>
          {cart.map(({ item, quantity }) => (
            <View
              key={item.id}
              style={tw`flex-row justify-between items-center mb-2`}
            >
              <Text style={tw`text-base`}>
                {item.name} x{quantity}
              </Text>
              <View style={tw`flex-row`}>
                <TouchableOpacity onPress={() => decreaseQuantity(item.id)}>
                  <Text style={tw`text-red-500 mx-2`}>➖</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => increaseQuantity(item.id)}>
                  <Text style={tw`text-green-500 mx-2`}>➕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <Text style={tw`mt-2 font-bold text-xl`}>
          Total: ₱{totalAmount.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={[
            tw`mt-4 p-3 rounded-lg`,
            cart.length === 0 ? tw`bg-gray-400` : tw`bg-blue-500`,
          ]}
          onPress={() => {
            if (cart.length > 0) setShowCheckoutModal(true);
          }}
          disabled={cart.length === 0}
        >
          <Text style={tw`text-white text-center font-semibold text-lg`}>
            Proceed to Checkout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Checkout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCheckoutModal}
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-6 rounded-lg w-11/12`}>
            <Text style={tw`text-xl font-bold mb-4`}>Checkout Summary</Text>
            <ScrollView style={tw`mb-4 max-h-40`}>
              {cart.map(({ item, quantity }) => (
                <View
                  key={item.id}
                  style={tw`flex-row justify-between mb-2`}
                >
                  <Text>
                    {item.name} x{quantity}
                  </Text>
                  <Text>₱{(item.price * quantity).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={tw`text-lg font-bold mb-4`}>
              Total: ₱{totalAmount.toFixed(2)}
            </Text>
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                onPress={() => setShowCheckoutModal(false)}
                style={tw`bg-gray-400 py-2 px-4 rounded-lg`}
              >
                <Text style={tw`text-white`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowCheckoutModal(false);
                  setShowPaymentModal(true);
                }}
                style={tw`bg-blue-500 py-2 px-4 rounded-lg`}
              >
                <Text style={tw`text-white`}>Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-6 rounded-lg w-11/12`}>
            <Text style={tw`text-xl font-bold mb-4`}>Payment</Text>
            <Text style={tw`mb-2`}>Total: ₱{totalAmount.toFixed(2)}</Text>
            <TextInput
              style={tw`border border-gray-300 p-2 mb-2 rounded-lg`}
              placeholder="Enter cash amount"
              keyboardType="numeric"
              value={cashInput}
              onChangeText={(text) => {
                setCashInput(text);
                if (error) setError("");
              }}
            />
            {error ? (
              <Text style={tw`text-red-500 mb-2`}>{error}</Text>
            ) : null}
            <View style={tw`flex-row justify-between`}>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={tw`bg-gray-400 py-2 px-4 rounded-lg`}
              >
                <Text style={tw`text-white`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePayment}
                style={tw`bg-blue-500 py-2 px-4 rounded-lg`}
              >
                <Text style={tw`text-white`}>Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
