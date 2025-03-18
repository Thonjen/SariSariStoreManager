import tw from "tailwind-react-native-classnames";
import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../lib/ThemeContext";
import { format, parseISO } from "date-fns";

interface Transaction {
  date: string;
  total: number;
  payment: number;
  change: number;
  items: { item: { name: string; price: number }; quantity: number }[];
}

export default function TransactionScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortDescending, setSortDescending] = useState(true); // Newest first by default
  const { theme, colorScheme } = useContext(ThemeContext);

  useEffect(() => {
    loadTransactions();
  }, [sortDescending]); // Reload transactions when sorting changes

  const loadTransactions = async () => {
    const storedTransactions = await AsyncStorage.getItem("transactions");
    if (storedTransactions) {
      const parsedTransactions: Transaction[] = JSON.parse(storedTransactions);

      // Sort transactions based on state
      const sortedTransactions = parsedTransactions.sort((a, b) => {
        return sortDescending
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setTransactions(sortedTransactions);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy - hh:mm a");
    } catch {
      return dateString;
    }
  };

  // Define theme-based styles
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-black";
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-gray-100";

  const accentColors: Record<string, string> = {
    blue: "border-blue-500",
    green: "border-green-500",
    red: "border-red-500",
    purple: "border-purple-500",
  };

  return (
    <View style={tw`flex-1 p-5 ${bgColor}`}>
      <Text style={tw`text-2xl font-bold text-center mb-5 ${textColor}`}>Transaction History</Text>
      
      {/* Sort Button */}
      <TouchableOpacity
        style={tw`mb-4 py-2 px-4 rounded-lg self-center ${accentColors[colorScheme]} border`}
        onPress={() => setSortDescending(!sortDescending)}
      >
        <Text style={tw`text-lg font-bold ${textColor}`}>
          {sortDescending ? "Sort: Oldest First" : "Sort: Newest First"}
        </Text>
      </TouchableOpacity>

      {transactions.length === 0 ? (
        <Text style={tw`text-center text-gray-500 text-lg`}>No transactions available</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={tw`p-4 mb-3 rounded-lg shadow ${cardBg} ${accentColors[colorScheme]} border-l-4`}>
              <Text style={tw`text-lg font-bold mb-2 ${textColor}`}>
                {formatDate(item.date)}
              </Text>

              {item.items.map((cartItem, idx) => (
                <Text key={idx} style={tw`ml-2 text-base ${textColor}`}>
                  {cartItem.item.name} x{cartItem.quantity} - ₱
                  {(cartItem.item.price * cartItem.quantity).toFixed(2)}
                </Text>
              ))}

              <Text style={tw`text-lg font-bold mt-2 ${textColor}`}>
                Total: ₱{item.total.toFixed(2)}
              </Text>
              <Text style={tw`text-base ${textColor}`}>
  💵 Payment: ₱{(item.payment ?? item.total).toFixed(2)}
</Text>
<Text style={tw`text-base text-green-600`}>
  💰 Change: ₱{(item.change ?? 0).toFixed(2)}
</Text>

            </View>
          )}
        />
      )}
    </View>
  );
}
