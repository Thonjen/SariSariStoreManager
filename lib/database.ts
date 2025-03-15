// SariSariManager/lib/database.ts
  import * as SQLite from 'expo-sqlite';

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
      const db = await getDB();
      const result = await db.runAsync(
        'INSERT INTO items (name, price, imageUri, categoryId) VALUES (?, ?, ?, ?);',
        [name, price, imageUri, categoryId]
      );
      return result.lastInsertRowId || null;
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
      const db = await getDB();
      return await db.getAllAsync(`
        SELECT items.*, categories.name as categoryName
        FROM items
        LEFT JOIN categories ON items.categoryId = categories.id;
      `);
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
      const db = await getDB();
      const result = await db.runAsync('SELECT * FROM items WHERE id = ?;', [id]);
      return result || null;
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
      const db = await getDB();
      await db.runAsync(
        'UPDATE items SET name = ?, price = ?, imageUri = ?, categoryId = ? WHERE id = ?;',
        [name, price, imageUri, categoryId, id]
      );
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
      const db = await getDB();
      await db.runAsync('DELETE FROM items WHERE id = ?;', [id]);
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
      const db = await getDB();
      return await db.getAllAsync('SELECT * FROM items WHERE name LIKE ?;', [`%${query}%`]);
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
      const db = await getDB();
      return await db.getAllAsync('SELECT * FROM items WHERE categoryId = ?;', [categoryId]);
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
      const db = await getDB();
      const column = orderBy === 'category' ? 'categoryId' : orderBy;
      return await db.getAllAsync(`SELECT * FROM items ORDER BY ${column};`);
    } catch (error) {
      console.error('Error fetching sorted items:', error);
      return [];
    }
  };

  /* ===============================
    Categories CRUD Methods
    =============================== */

  /**
   * Inserts a new category.
   */
  // Fetch all categories
  // Fetch categories
  export const fetchCategories = async (): Promise<{ id: number; name: string }[]> => {
      const db = await getDB();

      return await db.getAllAsync('SELECT * FROM categories;');
    };
    
    // Insert a new category
    export const insertCategory = async (name: string): Promise<number | null> => {
      try {
          const db = await getDB();

        const result = await db.runAsync('INSERT INTO categories (name) VALUES (?);', [name]);
        return result.lastInsertRowId; // Returns the new category ID
      } catch (error) {
        console.error('Insert error:', error);
        return null;
      }
    };
    
    // Update a category name
    export const updateCategory = async (id: number, name: string): Promise<boolean> => {
      try {
          const db = await getDB();

        await db.runAsync('UPDATE categories SET name = ? WHERE id = ?;', [name, id]);
        return true; // Indicating success
      } catch (error) {
        console.error('Update error:', error);
        return false; // Indicating failure
      }
    };
    
    
    // Delete a category
    export const deleteCategory = async (id: number): Promise<void> => {
      const db = await getDB();
      await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
    };
    
    // Ensure default categories exist
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
        const db = await getDB();
        const result = await db.runAsync('SELECT * FROM categories WHERE id = ?;', [id]);
        return result || null;
      } catch (error) {
        console.error('Error fetching category by ID:', error);
        return null;
      }
    };