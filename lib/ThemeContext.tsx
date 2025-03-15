import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';
export type ColorScheme = 'blue' | 'green' | 'red' | 'purple';

type ThemeContextType = {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colorScheme: 'blue',
  setTheme: () => {},
  setColorScheme: () => {},
});

// Define the props type for ThemeProvider
type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue');

  useEffect(() => {
    const loadSettings = async () => {
      const storedTheme = await AsyncStorage.getItem('APP_THEME');
      const storedColorScheme = await AsyncStorage.getItem('APP_COLOR_SCHEME');
      if (storedTheme) setTheme(storedTheme as Theme);
      if (storedColorScheme) setColorScheme(storedColorScheme as ColorScheme);
    };
    loadSettings();
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    AsyncStorage.setItem('APP_THEME', newTheme);
  };

  const changeColorScheme = (newColorScheme: ColorScheme) => {
    setColorScheme(newColorScheme);
    AsyncStorage.setItem('APP_COLOR_SCHEME', newColorScheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme: changeTheme, setColorScheme: changeColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
