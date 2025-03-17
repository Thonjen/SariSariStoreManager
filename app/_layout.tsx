import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import tw from "tailwind-react-native-classnames";
import { MaterialIcons } from "@expo/vector-icons";
import { initDatabase, ensureDefaultCategories } from "@/lib/database";
import ItemsScreen from "./index";
import CategoriesScreen from "./categories";
import SettingsScreen from "./settings";
import POSScreen from "./posscreen";
import { ItemsProvider } from "@/lib/ItemsContext";
import { ThemeProvider, ThemeContext } from "@/lib/ThemeContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get("window");

function Content() {
  const { colorScheme } = useContext(ThemeContext);
  // Map your theme's color scheme to actual hex values.
  const colorMap: Record<string, string> = {
    blue: "#3B82F6",
    red: "#EF4444",
    green: "#10B981",
    purple: "#8B5CF6",
  };
  const primaryColor = colorMap[colorScheme] || "#000";

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await initDatabase();
      await ensureDefaultCategories();
      setLoading(false);
    })();
  }, []);

  return (
    <ItemsProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={tw`flex-1 bg-white`}>
          {loading ? (
            <ActivityIndicator size="large" color={primaryColor} />
          ) : (
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: primaryColor,
                tabBarInactiveTintColor: "#666",
                tabBarStyle: {
                  backgroundColor: "#fff",
                  borderTopColor: primaryColor,
                },
                tabBarIcon: ({ color, size }) => {
                  const icons: Record<
                    "Items" | "Categories" | "Settings" | "POS",
                    keyof typeof MaterialIcons.glyphMap
                  > = {
                    Items: "list",
                    Categories: "category",
                    Settings: "settings",
                    POS: "list",
                  };
                  const iconName =
                    icons[
                      route.name as "Items" | "Categories" | "Settings" | "POS"
                    ];
                  return (
                    <MaterialIcons name={iconName} size={size} color={color} />
                  );
                },
              })}
            >
              <Tab.Screen name="Items" component={ItemsScreen} />
              <Tab.Screen name="Categories" component={CategoriesScreen} />
              <Tab.Screen
                name="POS"
                children={() => (
                  <POSScreen visible={true} onClose={() => {}} />
                )}
              />
              <Tab.Screen name="Settings" component={SettingsScreen} />

            </Tab.Navigator>
          )}
          <StatusBar style="auto" />
        </SafeAreaView>
      </GestureHandlerRootView>
    </ItemsProvider>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <Content />
    </ThemeProvider>
  );
}
