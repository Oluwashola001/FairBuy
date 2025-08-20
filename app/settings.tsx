// app/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from './contexts/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  const themeOptions: { label: string; value: ThemeMode; icon: string; description: string }[] = [
    { 
      label: 'Light Mode', 
      value: 'light', 
      icon: 'sunny-outline',
      description: 'Use light theme always'
    },
    { 
      label: 'Dark Mode', 
      value: 'dark', 
      icon: 'moon-outline',
      description: 'Use dark theme always'
    },
    { 
      label: 'System Default', 
      value: 'system', 
      icon: 'phone-portrait-outline',
      description: 'Follow system setting'
    },
  ];

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how the app looks on your device
          </Text>
          
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                themeMode === option.value && styles.selectedOption
              ]}
              onPress={() => setThemeMode(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.iconContainer,
                  themeMode === option.value && styles.selectedIconContainer
                ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={themeMode === option.value ? theme.background : theme.primary}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionText,
                    themeMode === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              
              {themeMode === option.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Sample Card</Text>
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>
                  {isDark ? 'Dark' : 'Light'}
                </Text>
              </View>
            </View>
            <Text style={styles.previewSubtitle}>
              This is how your app will look in {isDark ? 'dark' : 'light'} mode. 
              All screens will automatically adapt to your selected theme.
            </Text>
            <TouchableOpacity style={styles.previewButton} activeOpacity={0.8}>
              <Text style={styles.previewButtonText}>Sample Button</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={theme.info} />
            <Text style={styles.infoText}>
              Theme changes apply instantly across all screens
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: theme.surface,
    borderColor: theme.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedIconContainer: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  previewBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: theme.background,
    fontSize: 12,
    fontWeight: '600',
  },
  previewSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  previewButton: {
    backgroundColor: theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  previewButtonText: {
    color: theme.background,
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});