import React, { useContext, useEffect, useState, useCallback  } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Image, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from 'tailwind-react-native-classnames';
import { ThemeContext } from '@/lib/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCategories, fetchItems } from '@/lib/database';
import { MaterialIcons } from '@expo/vector-icons';
import { eventBus } from "@/lib/eventBus";
import { useFocusEffect } from '@react-navigation/native';


export default function Settings() {
  const navigation = useNavigation();
  const { colorScheme, setColorScheme } = useContext(ThemeContext); // Get current color scheme and setter function
  const [isModalVisible, setModalVisible] = useState(false);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [recentlyDeleted, setRecentlyDeleted] = useState(0);

  const colorSchemes = [
    { name: 'Blue', primary: 'blue' },
    { name: 'Green', primary: 'green' },
    { name: 'Red', primary: 'red' },
    { name: 'Purple', primary: 'purple' },
  ];

  // Handle color scheme change
  const handleColorSchemeChange = (newColorScheme: ColorScheme) => {
    setColorScheme(newColorScheme); // Update color scheme in context
  };

  const saveStorage = async () => {
    try {
      await AsyncStorage.setItem('settingsData', JSON.stringify({ colorScheme }));
    } catch (error) {
      console.error('Error saving settings data:', error);
    }
  };

  const loadStorage = async () => {
    try {
      const data = await AsyncStorage.getItem('settingsData');
      if (data) {
        setColorScheme(JSON.parse(data).colorScheme);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const categories = await fetchCategories();
      const items = await fetchItems();
      const transactions = JSON.parse(await AsyncStorage.getItem('transactions') || '[]'); // Default fallback
      const deletedItems = JSON.parse(await AsyncStorage.getItem('recentlyDeleted') || '[]'); // Default fallback
      eventBus.emit("itemsUpdated");

      setTotalCategories(categories.length);
      setTotalItems(items.length);
      setTotalTransactions(transactions.length);
      setRecentlyDeleted(deletedItems.length);

    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    loadStorage(); // Load storage only once when the component mounts
    
    const handleItemsUpdated = async () => {
      await loadStatistics(); // Update stats when items are updated
    };
    const handleTransactionsUpdated = async () => {
      await loadStatistics(); // Update stats when items are updated
    };
  
    eventBus.on("itemsUpdated", handleItemsUpdated);
    eventBus.on("transactionsUpdated", handleTransactionsUpdated);

  
    return () => {
      eventBus.off("itemsUpdated", handleItemsUpdated);
      eventBus.off("transactionsUpdated", handleTransactionsUpdated);

    };
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadStatistics(); // Ensure stats update when screen is focused
    }, [])
  );
  

  useEffect(() => {
    saveStorage();
  }, [colorScheme]);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <Text style={tw`text-2xl font-bold text-black`}>Settings</Text>

        {/* Color Scheme Selection */}
        <View style={tw`mt-6`}>
          <Text style={tw`text-lg text-black`}>Color Scheme</Text>
          <View style={tw`flex-row flex-wrap mt-2`}>
            {colorSchemes.map((scheme) => (
              <TouchableOpacity
                key={scheme.name}
                onPress={() => handleColorSchemeChange(scheme.primary)} // Update color scheme on press
                style={tw`p-2 m-1 rounded-full border ${
                  colorScheme === scheme.primary ? `bg-${scheme.primary}-500 border-${scheme.primary}-500` : 'bg-white border-gray-300'
                }`}
              >
                <Text style={tw`${colorScheme === scheme.primary ? 'text-white' : 'text-black'}`}>{scheme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <TouchableOpacity onPress={() => navigation.navigate('Minigame')} style={tw`mt-6 py-3 bg-${colorScheme}-500 rounded shadow-lg`}>
          <Text style={tw`text-white text-center font-semibold`}>Play Minigame</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('CategoriesScreen')} style={tw`mt-6 py-3 bg-${colorScheme}-500 rounded shadow-lg`}>
          <Text style={tw`text-white text-center font-semibold`}>Add Categories</Text>
        </TouchableOpacity>

        {/* About Button */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={tw`mt-6 py-3 bg-${colorScheme}-800 rounded shadow-lg`}>
          <Text style={tw`text-white text-center font-semibold`}>About</Text>
        </TouchableOpacity>

        {/* About Modal */}
        <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={tw`flex-1 justify-center items-center bg-${colorScheme}-100 bg-opacity-50`}>
            <View style={tw`bg-white p-6 rounded-lg w-4/5`}>
              <Text style={tw`text-xl font-bold text-black mb-4`}>About</Text>
              <Text style={tw`text-gray-700 mb-4`}>
                A simple inventory app for sari-sari store owners to organize and manage their products efficiently.
              </Text>
              <Text style={tw`text-xl font-bold text-black mb-4`}>Author</Text>
              <Image source={require('@/assets/images/author.jpg')} style={tw`w-24 h-24 rounded-full self-center mb-4`} />
              <Text style={tw`text-gray-700 text-center`}>Developed by Thonjen. For more information, Dont.</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`mt-6 py-2 bg-${colorScheme}-700 rounded shadow-lg`}>
                <Text style={tw`text-white text-center font-semibold`}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Statistics Section */}
        <View style={tw`mt-6 px-4`}>
          <Text style={tw`text-xl font-bold text-black mb-3`}>Statistics</Text>

          <View style={tw`flex-row flex-wrap justify-between`}>
            {[{ label: 'Categories', value: totalCategories, icon: 'category', color: '#4A90E2' },
              { label: 'Items', value: totalItems, icon: 'inventory-2', color: '#27AE60' },
              { label: 'Transactions', value: totalTransactions, icon: 'attach-money', color: '#E67E22', onPress: () => navigation.navigate('TransactionScreen') },
              { label: 'Deleted', value: recentlyDeleted, icon: 'delete', color: '#E74C3C', onPress: () => navigation.navigate('RecentlyDeletedScreen') }
            ].map(({ label, value, icon, color, onPress }, index) => (
              <TouchableOpacity
                key={label}
                onPress={onPress}
                activeOpacity={0.7}
                style={[
                  tw`bg-white p-3 rounded-lg shadow-sm flex-row items-center border border-gray-200`,
                  { width: '48%', marginTop: index > 1 ? 12 : 0 }
                ]}
              >
                <MaterialIcons name={icon as any} size={28} color={color} style={tw`mr-2`} />
                <View>
                  <Text style={tw`text-gray-600 text-sm`}>{label}</Text>
                  <Text style={tw`text-xl font-bold text-black`}>{value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

