import React, { useState, useContext, useEffect } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import tw from "tailwind-react-native-classnames";
import { updateItem, updateCategory, fetchCategories } from "../lib/database";
import { ThemeContext } from "../lib/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from '@/lib/eventBus';

type Item = {
  id: number;
  name: string;
  price: number;
  imageUri?: string;
  categoryId?: number;
  categoryName?: string;
};

type Category = {
  id: number;
  name: string;
  count?: number;
};

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  type: "item" | "category";
  data: Item | Category;
  refresh: (updatedData: Item | Category) => void;
};

export default function EditModal({
  visible,
  onClose,
  type,
  data,
  refresh,
}: EditModalProps) {
  const { theme, colorScheme } = useContext(ThemeContext);
  const { width: screenWidth } = useWindowDimensions();

  const [name, setName] = useState(data.name);
  const [price, setPrice] = useState(
    type === "item" ? (data as Item).price?.toString() || "" : ""
  );
  const [imageUri, setImageUri] = useState(
    type === "item" ? (data as Item).imageUri || "" : ""
  );
  const [categoryId, setCategoryId] = useState(
    type === "item" ? (data as Item).categoryId || null : null
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type === "item") {
      const loadCategories = async () => {
        const storedCategories = await AsyncStorage.getItem("categories");
        const cats = storedCategories ? JSON.parse(storedCategories) : [];
        setCategories(cats);
      };
      loadCategories();

      // Listen for category updates
      eventBus.on('categoriesUpdated', loadCategories);
      return () => {
        eventBus.off('categoriesUpdated', loadCategories);
      };
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setName(data.name);
      if (type === "item") {
        setPrice((data as Item).price?.toString() || "");
        setImageUri((data as Item).imageUri || "");
        setCategoryId((data as Item).categoryId || null);
      }
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

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Camera permission denied");
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera Error:", error);
      Alert.alert("Error", "Failed to take photo.");
    }
  };

  const handleSave = async () => {
    Alert.alert("Confirm Save", "Are you sure you want to save the changes?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        onPress: async () => {
          setLoading(true);
          if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty.");
            setLoading(false);
            return;
          }

          let updatedData = { ...data, name: name.trim() };

          const storedCategories = await AsyncStorage.getItem("categories");
          let categories: Category[] = storedCategories
            ? JSON.parse(storedCategories)
            : [];

          if (type === "item") {
            if (!price.trim() || !categoryId) {
              Alert.alert("Error", "Please fill all fields.");
              setLoading(false);
              return;
            }

            updatedData = {
              ...updatedData,
              price: parseFloat(price),
              imageUri,
              categoryId,
              categoryName:
                categories.find((cat) => cat.id === categoryId)?.name ||
                "No Category",
            };

            // Update item in AsyncStorage
            const storedItems = await AsyncStorage.getItem("items");
            let items: Item[] = storedItems ? JSON.parse(storedItems) : [];

            const updatedItems = items.map((item: Item) =>
              item.id === data.id ? (updatedData as Item) : item
            );
            await AsyncStorage.setItem("items", JSON.stringify(updatedItems));

            // Update category counts
            if ((data as Item).categoryId !== categoryId) {
              categories = categories.map((category: Category) => {
                if (category.id === (data as Item).categoryId) {
                  return {
                    ...category,
                    count: Math.max((category.count || 1) - 1, 0),
                  };
                } else if (category.id === categoryId) {
                  return { ...category, count: (category.count || 0) + 1 };
                }
                return category;
              });

              await AsyncStorage.setItem(
                "categories",
                JSON.stringify(categories)
              );
            }

            refresh(updatedData as Item);
            Alert.alert("Success", "Item updated successfully!");
          } else {
            refresh(updatedData as Category);
            Alert.alert("Success", "Category updated successfully!");
          }

          setLoading(false);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
      >
        <ScrollView
          contentContainerStyle={tw`flex-grow justify-center items-center h-4/5`}
        >
          <View
            style={[
              tw`bg-white p-6 rounded-lg border-4 shadow-xl`,
              {
                width: screenWidth / 1.2,
                maxWidth: 400,
                borderColor: colorScheme,
              },
            ]}
          >
            <Text style={tw`text-lg font-bold mb-4 text-black`}>
              Edit {type === "item" ? "Item" : "Category"}
            </Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor="black"
              style={tw`border border-black p-2 rounded mb-4`}
              value={name}
              onChangeText={setName}
            />
            {type === "item" && (
              <>
                <TextInput
                  placeholder="Price"
                  placeholderTextColor="black"
                  style={tw`border border-black p-2 rounded mb-4`}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
                <View
                  style={tw`flex-row flex-wrap border border-black rounded mb-4 p-2`}
                >
                  {categories.map((cat: Category) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={tw`p-2 m-1 ${
                        categoryId === cat.id
                          ? `bg-${colorScheme}-500`
                          : "bg-white border border-black"
                      }`}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <Text
                        style={tw`${
                          categoryId === cat.id ? "text-white" : "text-black"
                        }`}
                      >
                        {cat.name}
                      </Text>
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
                    source={require("../assets/images/Placeholder.jpg")}
                    style={tw`w-full h-40 rounded mb-4 border-2 border-black`}
                  />
                )}
                <View style={tw`flex-row justify-between mb-4`}>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={tw`p-3 bg-${colorScheme}-500 rounded flex-1 mr-2 shadow-md`}
                  >
                    <Text style={tw`text-white text-center`}>Choose Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={takePhoto}
                    style={tw`p-3 bg-${colorScheme}-700 rounded flex-1 ml-2 shadow-md`}
                  >
                    <Text style={tw`text-white text-center`}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
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
                <Text style={tw`text-white text-center`}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
