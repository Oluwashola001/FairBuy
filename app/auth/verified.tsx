// app/auth/verified.tsx
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function VerifiedScreen() {
  // Pull in the theme and dark mode status
  const { theme, isDark } = useTheme();
  
  // Generate styles based on the current theme
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Adapts the status bar text color based on the theme */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Text style={styles.title}>✅ Email Verified!</Text>
      <Text style={styles.message}>You can now log in to your account.</Text>

      <Link href="/auth/login" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

// Dynamic styling function
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: 320,
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});