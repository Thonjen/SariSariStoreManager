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
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import tw from "tailwind-react-native-classnames";
import { updateItem, updateCategory, fetchCategories } from "../lib/database";
import { ThemeContext } from "../lib/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from '@/lib/eventBus';
import { Picker } from "@react-native-picker/picker";

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
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

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

      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert("Error", "Failed to pick image.");
    } finally {
      setImagePickerVisible(false);
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
            // Update category in AsyncStorage
            const updatedCategories = categories.map((cat: Category) =>
              cat.id === data.id ? (updatedData as Category) : cat
            );
            await AsyncStorage.setItem("categories", JSON.stringify(updatedCategories));

            refresh(updatedData as Category); // Refresh the parent component with updated data
            eventBus.emit('categoryNameUpdated', updatedData); // Emit event for category name update
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
                <Text style={tw`text-sm font-semibold`}>Category</Text>
                <View style={tw`border border-gray-300 rounded mb-4`}>
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
                <TouchableOpacity onPress={() => setImagePickerVisible(true)}>
                  {imageUri ? (
                    
                    <View>
                      <Image
                        source={{ uri: imageUri }}
                        style={tw`w-full h-40 rounded mb-4 border-2 border-black`}
                      />
                      <Text style={tw`absolute bottom-2 right-2 bg-black text-white p-1 rounded`}>
                        Press to change/add photo
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Image
                        source={require("../assets/images/No_Image_Available.jpg")}
                        style={tw`w-full h-40 rounded mb-4 border-2 border-black`}
                      />
                      <Text style={tw`absolute bottom-2 right-2 bg-black text-white p-1 rounded`}>
                        Press to change/add photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
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

      <Modal
        visible={imagePickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <SafeAreaView style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-6 rounded-lg mx-5`}>
            <Text style={tw`text-lg font-bold mb-4 text-center`}>Select Image Source</Text>
            <TouchableOpacity
              onPress={() => pickImage("gallery")}
              style={tw`p-3 bg-${colorScheme}-500 rounded mb-4 shadow-md`}
            >
              <Text style={tw`text-white text-center`}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage("camera")}
              style={tw`p-3 bg-${colorScheme}-700 rounded shadow-md`}
            >
              <Text style={tw`text-white text-center`}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setImagePickerVisible(false)}
              style={tw`p-3 bg-gray-500 rounded mt-4 shadow-md`}
            >
              <Text style={tw`text-white text-center`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
}
