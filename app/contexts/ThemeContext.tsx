// contexts/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

// Define your color schemes
export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#4B56E9',
  secondary: '#6B7280',
  text: '#000000',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#FF3B30',
  success: '#00C851',
  warning: '#FF9500',
  info: '#4B56E9',
  shadow: 'rgba(0, 0, 0, 0.1)',
  statusBar: 'dark-content' as StatusBarStyle,
};

export const darkTheme = {
  background: '#000000',
  surface: '#1A1A1A',
  card: '#2A2A2A',
  primary: '#6366F1',
  secondary: '#9CA3AF',
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  border: '#374151',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  info: '#6366F1',
  shadow: 'rgba(0, 0, 0, 0.3)',
  statusBar: 'light-content' as StatusBarStyle,
};

export type Theme = typeof lightTheme;
export type StatusBarStyle = 'dark-content' | 'light-content';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState(
    Appearance.getColorScheme() || 'light'
  );

  // Determine if we should use dark theme
  const shouldUseDark = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  const theme = shouldUseDark ? darkTheme : lightTheme;
  const isDark = shouldUseDark;

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme || 'light');
    });

    return () => subscription?.remove();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    toggleTheme,
    setThemeMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};