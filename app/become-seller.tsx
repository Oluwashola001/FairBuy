// app/become-seller.tsx
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from './contexts/ThemeContext';

const brandColor = "#4B56E9";

const categories = [
  "Electronics", 
  "Fashion",
  "Beauty",
  "Health",
  "Sport",
  "Fitness",
  "Appliance",
  "Jewelry",
  "Furniture",
  "Gaming"
];

export default function BecomeSellerScreen() {
  const { theme, isDark } = useTheme();
  
  const [storeName, setStoreName] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [category, setCategory] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handleContinue = async () => {
    // Basic validation
    if (!storeName.trim() || !category) {
      Alert.alert("Missing Info", "Please provide at least a Store Name and Category.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Ensure the user is actually logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Authentication Required", "You must be logged in to become a seller.");
        router.replace('/auth/login');
        return;
      }

      // 2. Save all the seller data directly to their Supabase user metadata!
      const { error } = await supabase.auth.updateUser({
        data: {
          isSeller: true, // Helpful flag we can use later
          storeName,
          businessInfo,
          category,
          bankName,
          accountNumber,
          accountHolder,
          sellerJoinedDate: new Date().toISOString(),
        }
      });

      if (error) throw error;

      console.log("Seller Profile Data saved securely to Supabase!");

      // 3. Navigate to their shiny new synced profile screen
      router.push("/(seller)/profile"); 
      
    } catch (error: any) {
      console.error("Error saving seller data:", error);
      Alert.alert("Error", error.message || "Failed to create seller profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item)}
    >
      <Text style={styles.categoryItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>
            👨‍💼 Become a Seller
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Store Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              placeholder="e.g. leonardo store"
              value={storeName}
              onChangeText={setStoreName}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
              editable={!isSubmitting}
            />
          </View>

          {/* Business Info */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Business Info (Optional)</Text>
            <TextInput
              placeholder="What do you sell?"
              value={businessInfo}
              onChangeText={setBusinessInfo}
              style={[styles.input, styles.textArea]}
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
            />
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => !isSubmitting && setShowCategoryModal(true)}
              activeOpacity={isSubmitting ? 1 : 0.7}
            >
              <Text style={[
                styles.dropdownText, 
                category ? styles.selectedText : styles.placeholderText
              ]}>
                {category || "Select Category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Bank Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              placeholder="e.g. Chase Bank"
              value={bankName}
              onChangeText={setBankName}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
              editable={!isSubmitting}
            />
          </View>

          {/* Account Number */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              placeholder="••••••••••••"
              value={accountNumber}
              onChangeText={setAccountNumber}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
              secureTextEntry
              keyboardType="numeric"
              editable={!isSubmitting}
            />
          </View>

          {/* Account Holder Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              placeholder="e.g. John Doe"
              value={accountHolder}
              onChangeText={setAccountHolder}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
              editable={!isSubmitting}
            />
          </View>

          {/* Info Note */}
          <Text style={styles.infoText}>
            This information helps us verify sellers and{'\n'}enable secure payouts.
          </Text>

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Setting up Store..." : "Continue to Profile"}
            </Text>
          </TouchableOpacity>

          {/* Back to Buyer Mode */}
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => router.push('/(tabs)/home')}
            disabled={isSubmitting}
          >
            <Text style={styles.secondaryButtonText}>Back to Buyer Mode</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={renderCategoryItem}
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: theme.text,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: theme.surface,
    color: theme.text,
    minHeight: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    minHeight: 50,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: theme.textTertiary,
  },
  selectedText: {
    color: theme.text,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: brandColor,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: theme.textSecondary,
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  categoryItemText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: "500",
  },
});