import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { MaterialIcons } from '@expo/vector-icons';
import { insertCategory } from '@/lib/database';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
  onClose,
  onCategoryAdded,
}) => {
  const [name, setName] = useState<string>('');

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) return;
    const id = await insertCategory(name);
    if (id) {
      onCategoryAdded(); // Refresh categories in parent
      setName('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-70`}>
        <View style={tw`w-11/12 bg-white rounded-xl p-6`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-2xl font-semibold text-gray-800`}>Add Category</Text>
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={28} color="gray" />
            </Pressable>
          </View>
          <TextInput
            placeholder="Category name"
            value={name}
            onChangeText={setName}
            style={tw`border border-gray-300 p-3 rounded mb-4`}
          />
          <Pressable onPress={handleAdd} style={tw`py-3 bg-blue-500 rounded-xl`}>
            <Text style={tw`text-white text-center font-semibold`}>Add</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default AddCategoryModal;
