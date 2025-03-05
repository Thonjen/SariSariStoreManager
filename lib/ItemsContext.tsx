// ItemsContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

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
};

export const ItemsContext = createContext<ItemsContextType>({
  items: [],
  setItems: () => {},
});

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ItemType[]>([]);
  return (
    <ItemsContext.Provider value={{ items, setItems }}>
      {children}
    </ItemsContext.Provider>
  );
};
