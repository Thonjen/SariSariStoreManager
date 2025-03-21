import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ItemsContext, ItemType } from "../lib/ItemsContext";
import { ThemeContext } from "../lib/ThemeContext";
import tw from "tailwind-react-native-classnames";
import { Ionicons } from "@expo/vector-icons";
import { eventBus } from "@/lib/eventBus";



type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AddItemModal({ visible, onClose }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const { items, setItems } = useContext(ItemsContext);
  const { colorScheme } = useContext(ThemeContext);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const storedCategories = await AsyncStorage.getItem("categories");
        const cats = storedCategories ? JSON.parse(storedCategories) : [];
        if (!Array.isArray(cats)) throw new Error("Invalid categories format");
        setCategories(cats);
        setCategoryId(cats.length > 0 ? cats[0].id : null);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]); // Prevent empty data from crashing the UI
      }
    };
    loadCategories();

    // Listen for category updates
    eventBus.on('categoriesUpdated', loadCategories);
    return () => {
      eventBus.off('categoriesUpdated', loadCategories);
    };
  }, []);
  

  const pickImage = async (source: "camera" | "gallery") => {
    try {
      let result;
      const mediaType = ImagePicker.MediaTypeOptions.Images;
      
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") throw new Error("Camera permission denied");
  
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: mediaType,
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") throw new Error("Gallery permission denied");
  
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: mediaType,
          quality: 0.7,
        });
      }
  
      if (!result.canceled) {
        setImageUri(result.assets[0]?.uri || null);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };
  

  const handleSave = async () => {
    setLoading(true);
    if (!name || price === null || isNaN(price) || !categoryId || !imageUri) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all fields and select an image."
      );
      setLoading(false);
      return;
    }
  
    const storedItems = await AsyncStorage.getItem("items");
    const existingItems: ItemType[] = storedItems ? JSON.parse(storedItems) : [];
  
    // Prevent duplicate names
    if (
      existingItems.some(
        (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      Alert.alert("Duplicate Item", "An item with this name already exists.");
      setLoading(false);
      return;
    }
  
    // Add new item
    const newItem: ItemType = {
      id: Date.now(),
      name,
      price,
      categoryId,
      imageUri,
    };
    const updatedItems = [...existingItems, newItem];
    await AsyncStorage.setItem("items", JSON.stringify(updatedItems));
    setItems(updatedItems);
  
    // Notify POSScreen about the update
    eventBus.emit("itemsUpdated");
  
    // Update category count
    const storedCategories = await AsyncStorage.getItem("categories");
    let categories = storedCategories ? JSON.parse(storedCategories) : [];
  
    categories = categories.map((category: any) =>
      category.id === categoryId
        ? { ...category, count: (category.count || 0) + 1 }
        : category
    );
  
    await AsyncStorage.setItem("categories", JSON.stringify(categories));
  
    // Reset form fields after successful save
    setName("");
    setPrice(null);
    setCategoryId(categories.length > 0 ? categories[0].id : null);
    setImageUri(null);
  
    setLoading(false);
    onClose();
  };
  
  

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={tw`flex-1 justify-center bg-gray-900 bg-opacity-50`}>

        <View style={tw`bg-white p-5 rounded-lg mx-5`}>
          <Text style={tw`text-xl font-bold text-center mb-4`}>Add Item</Text>

          {/* Name Input */}
          <Text style={tw`text-sm font-semibold`}>Item Name</Text>
          <TextInput
            style={tw`border border-gray-300 p-2 rounded mb-3`}
            placeholder="Enter item name"
            value={name}
            onChangeText={setName}
          />

          {/* Price Input */}
          <Text style={tw`text-sm font-semibold`}>Price</Text>
          <TextInput
            style={tw`border border-gray-300 p-2 rounded mb-3`}
            placeholder="Enter price"
            keyboardType="numeric"
            value={price !== null ? price.toString() : ""}
            onChangeText={(text) => setPrice(text ? parseFloat(text) : null)}
          />

          {/* Category Picker */}
          <Text style={tw`text-sm font-semibold`}>Category</Text>
          <View style={tw`border border-gray-300 rounded mb-3`}>
            <Picker
              selectedValue={categoryId}
              onValueChange={(value) => setCategoryId(value)}
              style={tw`p-2`}
            >
              <Picker.Item label="Select Category" value={null} />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>

          {/* Image Picker Buttons */}
          <Text style={tw`text-sm font-semibold`}>Item Image</Text>
          <View style={tw`flex-row justify-between mb-3`}>
            <TouchableOpacity
              style={tw`bg-blue-500 flex-1 p-2 rounded mr-2 flex-row items-center justify-center`}
              onPress={() => pickImage("camera")}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={tw`text-white ml-2`}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-green-500 flex-1 p-2 rounded flex-row items-center justify-center`}
              onPress={() => pickImage("gallery")}
            >
              <Ionicons name="images" size={20} color="#fff" />
              <Text style={tw`text-white ml-2`}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={tw`w-full h-40 rounded mb-3`}
            />
          ) : (
            <View
              style={tw`w-full h-32 border border-gray-300 rounded flex items-center justify-center`}
            >
              <Ionicons name="image" size={50} color="#ccc" />
              <Text style={tw`text-gray-500`}>No Image Selected</Text>
            </View>
          )}

          {/* Save & Cancel Buttons */}
          <View style={tw`flex-row justify-between mt-4`}>
            <TouchableOpacity
              style={tw`bg-green-600 flex-1 p-2 rounded mr-2`}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={tw`text-white text-center`}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`bg-red-500 flex-1 p-2 rounded`}
              onPress={onClose}
            >
              <Text style={tw`text-white text-center`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
