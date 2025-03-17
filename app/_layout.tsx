import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import tw from 'tailwind-react-native-classnames';
import { MaterialIcons } from '@expo/vector-icons';
import { initDatabase, ensureDefaultCategories } from '@/lib/database';
import ItemsScreen from './index';
import CategoriesScreen from './categories';
import AddItemScreen from './additem';
import SettingsScreen from './settings';
import { ItemsProvider } from '@/lib/ItemsContext';
import { ThemeProvider, ThemeContext } from '@/lib/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Tab = createBottomTabNavigator();

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useContext(ThemeContext);

  useEffect(() => {
    const initializeDB = async () => {
      setLoading(true);
      await initDatabase();
      await ensureDefaultCategories();
      setLoading(false);
    };
    initializeDB();
  }, []);

  return (
    <ThemeProvider>
      <ItemsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={tw`flex-1 bg-white`}>
            {loading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  headerShown: false,
                  tabBarActiveTintColor: '#000',
                  tabBarInactiveTintColor: '#666',
                  tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#000' },
                  tabBarIcon: ({ color, size }) => {
                    let iconName: React.ComponentProps<typeof MaterialIcons>["name"] = 'list';
                    if (route.name === 'Items') {
                      iconName = 'list';
                    } else if (route.name === 'Categories') {
                      iconName = 'category';
                    } else if (route.name === 'Add Item') {
                      iconName = 'add';
                    } else if (route.name === 'Settings') {
                      iconName = 'settings';
                    }
                    return <MaterialIcons name={iconName} size={size} color={color} />;
                  },
                })}
              >
                <Tab.Screen name="Items" component={ItemsScreen} />
                <Tab.Screen name="Categories" component={CategoriesScreen} />
                <Tab.Screen name="Add Item" component={AddItemScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
              </Tab.Navigator>
            )}
            <StatusBar style="auto" />
          </SafeAreaView>
        </GestureHandlerRootView>
      </ItemsProvider>
    </ThemeProvider>
  );
}
