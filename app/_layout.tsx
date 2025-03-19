import React, { useState, useEffect, useContext } from "react";
import { SafeAreaView, View, ActivityIndicator, Dimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import tw from "tailwind-react-native-classnames";
import { MaterialIcons } from "@expo/vector-icons";
import { initDatabase, ensureDefaultCategories } from "@/lib/database";
import ItemsScreen from "./index";
import CategoriesScreen from "./categories";
import SettingsScreen from "./settings";
import POSScreen from "./posscreen";
import TransactionScreen from "./transaction";
import Minigame from "./minigame";
import { ItemsProvider } from "@/lib/ItemsContext";
import { ThemeProvider, ThemeContext } from "@/lib/ThemeContext";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import RecentlyDeletedScreen from "./recentlyDeleted";
import { useNavigation } from "@react-navigation/native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { colorScheme } = useContext(ThemeContext);
  const colorMap: Record<string, string> = {
    blue: "#3B82F6",
    red: "#EF4444",
    green: "#10B981",
    purple: "#8B5CF6",
  };
  const primaryColor = colorMap[colorScheme] || "#000";

  return (
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
          const icons: Record<"Items"  | "Settings" | "POS", keyof typeof MaterialIcons.glyphMap> = {
            Items: "list",
            Settings: "settings",
            POS: "point-of-sale",
          };
          return <MaterialIcons name={icons[route.name as keyof typeof icons]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Items">{() => <SwipeWrapper screen="Items" leftTarget="POS"><ItemsScreen /></SwipeWrapper>}</Tab.Screen>
      <Tab.Screen name="POS">{() => <SwipeWrapper screen="POS" leftTarget="Settings" rightTarget="Items"><POSScreen /></SwipeWrapper>}</Tab.Screen>
      <Tab.Screen name="Settings">{() => <SwipeWrapper screen="Settings" rightTarget="POS"><SettingsScreen /></SwipeWrapper>}</Tab.Screen>
    </Tab.Navigator>
  );
}

function SwipeWrapper({ children, screen, leftTarget, rightTarget }: { children: React.ReactNode; screen: string; leftTarget?: string; rightTarget?: string }) {
  const navigation = useNavigation();

  const handleSwipe = ({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;
      if (translationX < -50 && leftTarget) {
        // Swipe Left (Move to the next screen)
        navigation.navigate(leftTarget as never);
      } else if (translationX > 50 && rightTarget) {
        // Swipe Right (Move to the previous screen)
        navigation.navigate(rightTarget as never);
      }
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipe}>
      <View style={{ flex: 1 }}>{children}</View>
    </PanGestureHandler>
  );
}

function Content() {
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
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <Stack.Navigator>
              <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
              <Stack.Screen name="TransactionScreen" component={TransactionScreen} options={{ title: "Transactions" }} />
              <Stack.Screen name="RecentlyDeletedScreen" component={RecentlyDeletedScreen} options={{ title: "Recently Deleted" }} />
              <Stack.Screen name="Minigame" component={Minigame} options={{ title: "Minigame" }} />
              <Stack.Screen name="ItemsScreen" component={ItemsScreen} options={{ title: "ItemsScreen" }} />
              <Stack.Screen name="CategoriesScreen" component={CategoriesScreen} options={{ title: "CategoriesScreen" }} />
              <Stack.Screen name="POSScreen" component={POSScreen} options={{ title: "POSScreen" }} />
            </Stack.Navigator>
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
