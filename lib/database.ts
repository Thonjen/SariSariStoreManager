import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens the database or returns the existing connection.
 */
export const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('sarisari.db');
  }
  return db;
};

/**
 * Initializes the database by enabling WAL and foreign keys and creating tables.
 */
export const initDatabase = async () => {
  try {
    const db = await getDB();
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA foreign_keys = ON;");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        imageUri TEXT,
        categoryId INTEGER,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

/* ===============================
  Items CRUD and Helper Methods
  =============================== */

/**
 * Inserts a new item.
 */
export const insertItem = async (
  name: string,
  price: number,
  imageUri: string,
  categoryId: number
): Promise<number | null> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    const newItem = { id: Date.now(), name, price, imageUri, categoryId };
    items.push(newItem);
    await AsyncStorage.setItem('items', JSON.stringify(items));
    return newItem.id;
  } catch (error) {
    console.error('Error inserting item:', error);
    return null;
  }
};

/**
 * Fetches all items.
 */
export const fetchItems = async (): Promise<any[]> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    return storedItems ? JSON.parse(storedItems) : [];
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
};

/**
 * Fetches an item by ID.
 */
export const fetchItemById = async (id: number): Promise<any | null> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    return items.find((item: any) => item.id === id) || null;
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    return null;
  }
};

/**
 * Updates an item.
 */
export const updateItem = async (
  id: number,
  name: string,
  price: number,
  imageUri: string,
  categoryId: number
): Promise<boolean> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    const updatedItems = items.map((item: any) =>
      item.id === id ? { ...item, name, price, imageUri, categoryId } : item
    );
    await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
    return true;
  } catch (error) {
    console.error('Error updating item:', error);
    return false;
  }
};

/**
 * Deletes an item.
 */
export const deleteItem = async (id: number): Promise<boolean> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    const updatedItems = items.filter((item: any) => item.id !== id);
    await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
};

/**
 * Searches for items by name.
 */
export const searchItems = async (query: string): Promise<any[]> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching items:', error);
    return [];
  }
};

/**
 * Fetches items by category.
 */
export const fetchItemsByCategory = async (categoryId: number): Promise<any[]> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    return items.filter((item: any) => item.categoryId === categoryId);
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return [];
  }
};

/**
 * Fetches sorted items.
 */
export const fetchSortedItems = async (
  orderBy: 'name' | 'price' | 'category'
): Promise<any[]> => {
  try {
    const storedItems = await AsyncStorage.getItem('items');
    const items = storedItems ? JSON.parse(storedItems) : [];
    const column = orderBy === 'category' ? 'categoryId' : orderBy;
    return items.sort((a: any, b: any) => (a[column] > b[column] ? 1 : -1));
  } catch (error) {
    console.error('Error fetching sorted items:', error);
    return [];
  }
};

/* ===============================
  Categories CRUD Methods
  =============================== */

/**
 * Fetches all categories.
 */
export const fetchCategories = async (): Promise<{ id: number; name: string }[]> => {
  try {
    const storedCategories = await AsyncStorage.getItem('categories');
    return storedCategories ? JSON.parse(storedCategories) : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Inserts a new category.
 */
export const insertCategory = async (name: string): Promise<number | null> => {
  try {
    const storedCategories = await AsyncStorage.getItem('categories');
    const categories = storedCategories ? JSON.parse(storedCategories) : [];
    const newCategory = { id: Date.now(), name };
    categories.push(newCategory);
    await AsyncStorage.setItem('categories', JSON.stringify(categories));
    return newCategory.id;
  } catch (error) {
    console.error('Error inserting category:', error);
    return null;
  }
};

/**
 * Updates a category name.
 */
export const updateCategory = async (id: number, name: string): Promise<boolean> => {
  try {
    const storedCategories = await AsyncStorage.getItem('categories');
    const categories = storedCategories ? JSON.parse(storedCategories) : [];
    const updatedCategories = categories.map((category: any) =>
      category.id === id ? { ...category, name } : category
    );
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
};

/**
 * Deletes a category.
 */
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    const storedCategories = await AsyncStorage.getItem('categories');
    const categories = storedCategories ? JSON.parse(storedCategories) : [];
    const updatedCategories = categories.filter((category: any) => category.id !== id);
    await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
  } catch (error) {
    console.error('Error deleting category:', error);
  }
};

/**
 * Ensures default categories exist.
 */
export const ensureDefaultCategories = async () => {
  const categories = await fetchCategories();
  if (categories.length === 0) {
    const defaultCategories = ['Food', 'Snack', 'Beverage', 'Detergent'];
    for (const category of defaultCategories) {
      await insertCategory(category);
    }
  }
};

/**
 * Fetches a category by ID.
 */
export const fetchCategoryById = async (id: number): Promise<any | null> => {
  try {
    const storedCategories = await AsyncStorage.getItem('categories');
    const categories = storedCategories ? JSON.parse(storedCategories) : [];
    return categories.find((category: any) => category.id === id) || null;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    return null;
  }
};