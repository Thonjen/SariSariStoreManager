import React, { createContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
export type ItemType = {
  id: number;
  name: string;
  price: number;
  imageUri?: string;
  categoryId?: number;
  categoryName?: string;
};

type ItemsContextType = {
  items: ItemType[];
  setItems: React.Dispatch<React.SetStateAction<ItemType[]>>;
  updateItems: () => void;  // Added this function
};

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  setItems: () => {},
  updateItems: () => {},  // Default no-op function
});

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ItemType[]>([]);

  const updateItems = async () => {
    // Fetch updated items from AsyncStorage or database
    const storedItems = await AsyncStorage.getItem('items');
    setItems(storedItems ? JSON.parse(storedItems) : []);
  };

  return (
    <ItemsContext.Provider value={{ items, setItems, updateItems }}>
      {children}
    </ItemsContext.Provider>
  );
};
