// app/become-seller.tsx
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadySeller, setIsAlreadySeller] = useState(false);

  // --- Global Custom Modal State ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', onPress: () => hideAlert(), style: 'default' }]
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Pre-fetch existing seller data if they have already filled this out before
  useEffect(() => {
    const fetchExistingSellerData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('store_name, business_info, category, bank_name, account_number, account_holder, is_seller')
          .eq('id', session.user.id)
          .single();

        if (data) {
          if (data.store_name) setStoreName(data.store_name);
          if (data.business_info) setBusinessInfo(data.business_info);
          if (data.category) setCategory(data.category);
          if (data.bank_name) setBankName(data.bank_name);
          if (data.account_number) setAccountNumber(data.account_number);
          if (data.account_holder) setAccountHolder(data.account_holder);
          if (data.is_seller) setIsAlreadySeller(true);
        }
      } catch (error) {
        console.error("Error fetching existing seller data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingSellerData();
  }, []);

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handleContinue = async () => {
    if (!storeName.trim() || !category) {
      showAlert("Missing Info", "Please provide at least a Store Name and Category.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showAlert("Authentication Required", "You must be logged in to become a seller.", [
          { text: "Login", style: "default", onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // 1. Profiles-First: Save all data directly to the database profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_seller: true,
          store_name: storeName,
          business_info: businessInfo,
          category: category,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: accountHolder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 2. Backup basic flags to auth metadata
      await supabase.auth.updateUser({
        data: {
          isSeller: true,
          storeName: storeName,
        }
      });

      // 3. Navigate straight to the Seller Dashboard
      router.push("/(seller)/dashboard"); 
      
    } catch (error: any) {
      console.error("Error saving seller data:", error);
      showAlert("Error", error.message || "Failed to create seller profile.");
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

  if (isLoading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading seller profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Global Custom UI Modal for Alerts */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.modalOverlayAlert}>
          <View style={styles.modalAlertContainer}>
            <Text style={styles.modalAlertTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalAlertMessage}>{alertConfig.message}</Text>
            <View style={styles.modalAlertButtonGroup}>
              {alertConfig.buttons?.map((btn, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) setTimeout(btn.onPress, 100);
                  }}
                  style={[
                    styles.modalAlertBtn,
                    btn.style === 'destructive' ? styles.modalAlertBtnDestructive : 
                    btn.style === 'cancel' ? styles.modalAlertBtnCancel : styles.modalAlertBtnDefault
                  ]}
                >
                  <Text style={[
                    styles.modalAlertBtnText,
                    btn.style === 'cancel' ? { color: theme.text } : { color: '#fff' }
                  ]}>
                    {btn.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.header}>
              {isAlreadySeller ? "👨‍💼 Edit Store Details" : "👨‍💼 Become a Seller"}
            </Text>
            {isAlreadySeller && (
               <Text style={styles.subHeader}>Update your active store information below.</Text>
            )}
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Store Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Store Name <Text style={{color: '#ef4444'}}>*</Text></Text>
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
              <Text style={styles.label}>Category <Text style={{color: '#ef4444'}}>*</Text></Text>
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
                secureTextEntry={false} // Often better false for bank accounts so users can verify
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
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "Saving Store..." : isAlreadySeller ? "Update Store Details" : "Launch Store Dashboard"}
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
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    paddingBottom: 40,
    flexGrow: 1,
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
  subHeader: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    marginTop: 8,
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
  // Custom Alert Modal Styles
  modalOverlayAlert: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  modalAlertContainer: { backgroundColor: theme.card || "#fff", borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: theme.border || "#e1e5e9", shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 20 },
  modalAlertTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text || "#000", marginBottom: 8, textAlign: 'center' },
  modalAlertMessage: { fontSize: 15, color: theme.textSecondary || "#666", marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  modalAlertButtonGroup: { flexDirection: 'column', gap: 12 },
  modalAlertBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalAlertBtnDefault: { backgroundColor: brandColor },
  modalAlertBtnDestructive: { backgroundColor: '#EF4444' },
  modalAlertBtnCancel: { backgroundColor: theme.surface || "#f0f0f0", borderWidth: 1, borderColor: theme.border || "#e1e5e9" },
  modalAlertBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});