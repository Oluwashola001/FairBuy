// app/seller-profile-details/edit-store.tsx
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../app/contexts/ThemeContext"; // Adjust path if needed based on actual location

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

export default function EditStoreScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [storeName, setStoreName] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [category, setCategory] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Fetch current store info on load
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          setStoreName(user.user_metadata.storeName || "");
          setBusinessInfo(user.user_metadata.businessInfo || "");
          setCategory(user.user_metadata.category || "");
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, []);

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handleSave = async () => {
    if (!storeName.trim() || !category) {
      Alert.alert("Missing Info", "Store Name and Category are required.");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase.auth.updateUser({
        data: {
          storeName,
          businessInfo,
          category,
        }
      });

      if (error) throw error;

      Alert.alert("Success", "Your store information has been updated!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (error: any) {
      console.error("Error saving store data:", error);
      Alert.alert("Error", error.message || "Failed to update store info.");
    } finally {
      setIsSaving(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Store Info</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading store details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Store Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Store Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Store Name</Text>
            <TextInput
              placeholder="e.g. Leonardo's Boutique"
              value={storeName}
              onChangeText={setStoreName}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
              editable={!isSaving}
            />
          </View>

          {/* Business Info */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Business Info (Description)</Text>
            <TextInput
              placeholder="Tell buyers what makes your store special..."
              value={businessInfo}
              onChangeText={setBusinessInfo}
              style={[styles.input, styles.textArea]}
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={5}
              editable={!isSaving}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Primary Category</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => !isSaving && setShowCategoryModal(true)}
              activeOpacity={isSaving ? 1 : 0.7}
            >
              <Text style={[
                styles.dropdownText, 
                category ? styles.selectedText : styles.placeholderText
              ]}>
                {category || "Select a category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Bottom Save Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 24,
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
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: theme.surface,
    color: theme.text,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.surface,
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
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  saveButton: {
    backgroundColor: brandColor,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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