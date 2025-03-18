import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../lib/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";
import tw from "tailwind-react-native-classnames";

// Define Item Type
type Item = {
  id: string;
  name: string;
  price: number;
  imageUri?: string;
};

const RecentlyDeletedScreen = () => {
  const [deletedItems, setDeletedItems] = useState<Item[]>([]);
  const { theme, colorScheme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchDeletedItems = async () => {
      try {
        const storedDeleted = await AsyncStorage.getItem("recentlyDeleted");
        const parsedDeleted: Item[] = storedDeleted ? JSON.parse(storedDeleted) : [];
        setDeletedItems(parsedDeleted);
      } catch (error) {
        console.error("Error fetching deleted items:", error);
      }
    };

    fetchDeletedItems();
  }, []);

  const restoreItem = async (item: Item) => {
    Alert.alert(
      "Restore Item",
      "Do you want to restore this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            try {
              const storedItems = await AsyncStorage.getItem("items");
              const parsedItems: Item[] = storedItems ? JSON.parse(storedItems) : [];

              // Add item back to main items list
              const updatedItems = [...parsedItems, item];
              await AsyncStorage.setItem("items", JSON.stringify(updatedItems));

              // Remove from recently deleted
              const updatedDeleted = deletedItems.filter((i) => i.id !== item.id);
              await AsyncStorage.setItem("recentlyDeleted", JSON.stringify(updatedDeleted));
              setDeletedItems(updatedDeleted);
            } catch (error) {
              console.error("Error restoring item:", error);
            }
          },
        },
      ]
    );
  };

  const permanentlyDeleteItem = async (item: Item) => {
    Alert.alert(
      "Delete Permanently",
      "Do you want to remove this item permanently? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedDeleted = deletedItems.filter((i) => i.id !== item.id);
              await AsyncStorage.setItem("recentlyDeleted", JSON.stringify(updatedDeleted));
              setDeletedItems(updatedDeleted);
            } catch (error) {
              console.error("Error deleting item permanently:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={tw`flex-1 p-4 ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
      <Text style={tw`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"} mb-4`}>
        Recently Deleted Items
      </Text>
      {deletedItems.length === 0 ? (
        <Text style={tw`text-center text-gray-500`}>No items in Recently Deleted.</Text>
      ) : (
        <FlatList
          data={deletedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={tw`flex-row items-center p-3 mb-3 rounded-xl shadow-md bg-${colorScheme}-100`}
            >
              {/* Item Image */}
              <Image
                source={item.imageUri ? { uri: item.imageUri } : require("../assets/images/Placeholder.jpg")}
                style={tw`w-16 h-16 rounded-lg`}
              />

              {/* Item Info */}
              <View style={tw`flex-1 ml-4`}>
                <Text style={tw`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                  {item.name}
                </Text>
                <Text style={tw`text-gray-500`}>₱{item.price}</Text>
              </View>

              {/* Restore & Delete Buttons */}
              <TouchableOpacity
                onPress={() => restoreItem(item)}
                style={tw`p-2 rounded-lg bg-${colorScheme}-500 mr-2`}
              >
                <MaterialIcons name="restore" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => permanentlyDeleteItem(item)}
                style={tw`p-2 rounded-lg bg-red-500`}
              >
                <MaterialIcons name="delete-forever" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default RecentlyDeletedScreen;
