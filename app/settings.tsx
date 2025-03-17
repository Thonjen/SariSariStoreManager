import React, { useContext } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Image  } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'tailwind-react-native-classnames';
import { ThemeContext, ColorScheme } from '@/lib/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

export default function Settings() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useContext(ThemeContext);

  const colorSchemes: { name: string; primary: ColorScheme }[] = [
    { name: 'Blue', primary: 'blue' },
    { name: 'Green', primary: 'green' },
    { name: 'Red', primary: 'red' },
    { name: 'Purple', primary: 'purple' },
  ];

  const saveStorage = async () => {
    try {
      const data = { colorScheme };
      await AsyncStorage.setItem('settingsData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving settings data:', error);
    }
  };

  const loadStorage = async () => {
    try {
      const data = await AsyncStorage.getItem('settingsData');
      if (data) {
        const { colorScheme } = JSON.parse(data);
        setColorScheme(colorScheme);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  };

  const saveDatabaseToFile = async () => {
    try {
      const dbUri = `${FileSystem.documentDirectory}SQLite/sarisari.db`;
      const fileUri = `${FileSystem.documentDirectory}sarisari_backup.db`;
      await FileSystem.copyAsync({ from: dbUri, to: fileUri });
      await Sharing.shareAsync(fileUri);
      alert('Database saved and ready for download!');
    } catch (error) {
      console.error('Error saving database to file:', error);
    }
  };

  const loadDatabaseFromFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled) {
        const uri = (result as any).uri;
        const dbUri = `${FileSystem.documentDirectory}SQLite/sarisari.db`;
        await FileSystem.copyAsync({ from: uri, to: dbUri });
        alert('Database loaded successfully!');
      }
    } catch (error) {
      console.error('Error loading database from file:', error);
    }
  };

  React.useEffect(() => {
    loadStorage();
  }, []);

  React.useEffect(() => {
    saveStorage();
  }, [colorScheme]);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <Text style={tw`text-2xl font-bold text-black`}>Settings</Text>
        <View style={tw`mt-6`}>
          <Text style={tw`text-lg text-black`}>Color Scheme</Text>
          <View style={tw`flex-row flex-wrap mt-2`}>
            {colorSchemes.map((scheme) => (
              <TouchableOpacity
                key={scheme.name}
                onPress={() => setColorScheme(scheme.primary)}
                style={tw`p-2 m-1 rounded-full border ${colorScheme === scheme.primary ? `bg-${scheme.primary}-500 border-${scheme.primary}-500` : 'bg-white border-gray-300'}`}
              >
                <Text style={tw`${colorScheme === scheme.primary ? 'text-white' : 'text-black'}`}>{scheme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/minigame')}
          style={tw`mt-6 py-3 bg-${colorScheme}-500 rounded shadow-lg`}
        >

          
          <Text style={tw`text-white text-center font-semibold`}>Play Mini Game</Text>
        </TouchableOpacity>

                {/* Save and Load Database Buttons */}
                <View style={tw`mt-6`}>
          <TouchableOpacity
            onPress={saveDatabaseToFile}
            style={tw`py-3 bg-${colorScheme}-900 rounded shadow-lg mb-4`}
          >
            <Text style={tw`text-white text-center font-semibold`}>Save Database to File</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={loadDatabaseFromFile}
            style={tw`py-3 bg-${colorScheme}-800 rounded shadow-lg`}
          >
            <Text style={tw`text-white text-center font-semibold`}>Load Database from File</Text>
          </TouchableOpacity>
        </View>
        {/* About Section */}
        <View style={tw`mt-6`}>
          <Text style={tw`text-lg text-black`}>About</Text>
          <Text style={tw`text-base text-gray-700 mt-2`}>
            A simple inventory app for sari-sari store owners to organize and manage their products efficiently.
          </Text>
        </View>
        {/* Author Section */}
        <View style={tw`mt-6`}>
          <Text style={tw`text-lg text-black`}>Author</Text>
          <Image 
            source={require('@/assets/images/author.jpg')} 
            style={tw`w-24 h-24 rounded-full`}
          />
          <Text style={tw`text-base text-gray-700 mt-2`}>
            Developed by [Your Name]. For more information, visit [Your Website].
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
