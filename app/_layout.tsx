// _layout.tsx
import React, { useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import tw from 'tailwind-react-native-classnames';
import { MaterialIcons } from '@expo/vector-icons';
import { initDatabase, ensureDefaultCategories } from '@/lib/database';

// Import your screens and ItemsProvider
import ItemsScreen from './index';
import CategoriesScreen from './categories';
import AddItemScreen from './add-item';
import { ItemsProvider } from '@/lib/ItemsContext';

const Tab = createBottomTabNavigator();

export default function Layout() {
  useEffect(() => {
    const initializeDB = async () => {
      await initDatabase();
      await ensureDefaultCategories();
    };
    initializeDB();
  }, []);

  return (
    <ItemsProvider>
      <SafeAreaView style={tw`flex-1 bg-white`}>
        {/* Header */}
        <View style={tw`bg-black p-4`}>
          <Text style={tw`text-white text-center text-xl font-bold`}>My App</Text>
        </View>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#000',
            tabBarInactiveTintColor: '#666',
            tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#000' },
            tabBarIcon: ({ color, size }) => {
              let iconName: React.ComponentProps<typeof MaterialIcons>["name"] = "list";
              if (route.name === 'Items') {
                iconName = 'list';
              } else if (route.name === 'Categories') {
                iconName = 'category';
              } else if (route.name === 'Add Item') {
                iconName = 'add';
              }
              return <MaterialIcons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Items" component={ItemsScreen} />
          <Tab.Screen name="Categories" component={CategoriesScreen} />
          <Tab.Screen name="Add Item" component={AddItemScreen} />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </SafeAreaView>
    </ItemsProvider>
  );
}
