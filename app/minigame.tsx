import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'tailwind-react-native-classnames';
import {
  initDatabase,
  fetchItems,
  fetchCategories,
} from '@/lib/database';
import { ThemeContext } from '@/lib/ThemeContext';

type Category = { id: number; name: string };
type Item = {
  id: number;
  name: string;
  price: number;
  imageUri?: string;
  categoryId: number;
  categoryName?: string;
};

const MAX_ROUNDS = 10; // total rounds per game

const MiniGame = () => {
  // Data from database
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Game state
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Leaderboard (an array of numbers)
  const [leaderboard, setLeaderboard] = useState<number[]>([]);
  const { colorScheme } = useContext(ThemeContext);

  useEffect(() => {
    const initAndLoad = async () => {
      await initDatabase();
      const fetchedItems = await fetchItems();
      const fetchedCategories = await fetchCategories();
      setItems(fetchedItems);
      setCategories(fetchedCategories);
      setLoading(false);
      if (fetchedItems.length > 0 && fetchedCategories.length > 0) {
        nextRound(fetchedItems, fetchedCategories, true);
      }
    };
    initAndLoad();
    loadLeaderboard();
  }, []);

  // Load leaderboard from AsyncStorage
  const loadLeaderboard = async () => {
    try {
      const stored = await AsyncStorage.getItem('LEADERBOARD');
      const data = stored ? JSON.parse(stored) : [];
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Save and update leaderboard in AsyncStorage
  const updateLeaderboard = async (currentScore: number) => {
    try {
      const stored = await AsyncStorage.getItem('LEADERBOARD');
      let leaderboardData = stored ? JSON.parse(stored) : [];
      leaderboardData.push(currentScore);
      // Sort descending and keep top 5 scores
      leaderboardData.sort((a: number, b: number) => b - a);
      leaderboardData = leaderboardData.slice(0, 5);
      await AsyncStorage.setItem('LEADERBOARD', JSON.stringify(leaderboardData));
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  // Shuffle helper
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Generate a new round; if initial flag is passed, do not increment round
  const nextRound = (
    loadedItems = items,
    loadedCategories = categories,
    initial = false
  ) => {
    // If not initial, increment round count
    if (!initial) {
      if (round + 1 >= MAX_ROUNDS) {
        setRound(prev => prev + 1);
        // Game over: update leaderboard
        setGameOver(true);
        updateLeaderboard(score);
        return;
      } else {
        setRound(prev => prev + 1);
      }
    } else {
      setRound(1);
    }
    setResult('');
    setAnswered(false);
    // Select a random item
    const randomItem =
      loadedItems[Math.floor(Math.random() * loadedItems.length)];
    setCurrentItem(randomItem);
    // Get the correct category name
    const correctCategory =
      loadedCategories.find((c) => c.id === randomItem.categoryId)?.name || '';
    // Build wrong options from remaining categories
    const otherCategories = loadedCategories
      .filter((c) => c.name !== correctCategory)
      .map((c) => c.name);
    let wrongOptions: string[] = [];
    while (otherCategories.length && wrongOptions.length < 3) {
      const index = Math.floor(Math.random() * otherCategories.length);
      wrongOptions.push(otherCategories[index]);
      otherCategories.splice(index, 1);
    }
    // Merge and shuffle options
    const allOptions = shuffleArray([correctCategory, ...wrongOptions]);
    setOptions(allOptions);
  };

  // Handle answer selection
  const handleAnswer = (selectedOption: string) => {
    if (!currentItem || answered) return;
    const correctCategory =
      categories.find((c) => c.id === currentItem.categoryId)?.name || '';
    if (selectedOption === correctCategory) {
      setResult('Correct!');
      setScore(prev => prev + 1);
    } else {
      setResult(`Wrong! The correct answer is "${correctCategory}".`);
    }
    setAnswered(true);
  };

  // Reset game state to try again
  const resetGame = () => {
    setScore(0);
    setRound(0);
    setGameOver(false);
    setResult('');
    setAnswered(false);
    nextRound();
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If there are no items/categories
  if (items.length === 0 || categories.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text style={tw`text-xl text-black`}>
          No items or categories available for the game.
        </Text>
      </View>
    );
  }

  // Game Over screen with leaderboard
  if (gameOver || showLeaderboard) {
    return (
      <ScrollView contentContainerStyle={tw`flex-1 bg-white p-4 justify-center items-center`}>
        <Text style={tw`text-3xl font-bold text-black mb-4`}>Leaderboard</Text>
        {leaderboard.length > 0 ? (
          leaderboard.map((scoreEntry, index) => (
            <Text key={index} style={tw`text-lg text-black`}>
              {index + 1}. {scoreEntry}
            </Text>
          ))
        ) : (
          <Text style={tw`text-lg text-black`}>No scores yet.</Text>
        )}
        <TouchableOpacity
          onPress={() => {
            setShowLeaderboard(false);
            if (gameOver) resetGame();
          }}
          style={tw`mt-6 py-3 px-6 bg-${colorScheme}-600 rounded`}
        >
          <Text style={tw`text-white text-center text-lg`}>{gameOver ? 'Try Again' : 'Back to Game'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={tw`flex-1 bg-white p-4 `}>
              {/* Header */}
      <Text style={tw`text-2xl font-bold text-black text-center mb-2 mt-6`}>
        Guess the Category!
      </Text>
      <Text style={tw`text-lg text-black text-center mb-4`}>
        Round: {round} / {MAX_ROUNDS} | Score: {score}
      </Text>
      
      {currentItem && (
        <View style={tw`bg-gray-100 p-4 rounded-lg mb-4`}>
          {currentItem.imageUri ? (
            <Image
              source={{ uri: currentItem.imageUri }}
              style={tw`w-full h-40 rounded mb-2`}
              resizeMode="cover"
            />
          ) : (
            <View
              style={tw`w-full h-40 bg-gray-300 justify-center items-center rounded mb-2`}
            >
              <Text style={tw`text-gray-700`}>No Image</Text>
            </View>
          )}
          <Text style={tw`text-xl text-black font-semibold mb-1`}>
            {currentItem.name}
          </Text>
          <Text style={tw`text-lg text-black mb-2`}>Price: ₱{currentItem.price}</Text>
        </View>
      )}

      <View style={tw`mb-4`}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleAnswer(option)}
            disabled={answered}
            style={tw`py-3 px-4 bg-${colorScheme}-600 rounded mb-2 ${answered ? 'opacity-70' : ''}`}
          >
            <Text style={tw`text-white text-center`}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {result !== '' && (
        <Text style={tw`text-xl text-center font-bold mb-4 text-black`}>
          {result}
        </Text>
      )}

      {answered && (
        <TouchableOpacity
          onPress={() => nextRound()}
          style={tw`py-3 px-4 bg-${colorScheme}-600 rounded`}
        >
          <Text style={tw`text-white text-center`}>Next</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => setShowLeaderboard(true)}
        style={tw`py-3 px-4 bg-${colorScheme}-600 rounded mb-4`}
      >
        <Text style={tw`text-white text-center`}>View Leaderboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MiniGame;
