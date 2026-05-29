// app/seller-profile-details/bank-details.tsx
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const brandColor = "#4B56E9";

export default function BankDetailsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current bank info on load
  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
          setBankName(user.user_metadata.bankName || "");
          setAccountNumber(user.user_metadata.accountNumber || "");
          setAccountHolder(user.user_metadata.accountHolder || "");
        }
      } catch (error) {
        console.error("Error fetching bank info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankInfo();
  }, []);

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      Alert.alert("Missing Info", "Please fill out all banking fields to ensure successful payouts.");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase.auth.updateUser({
        data: {
          bankName,
          accountNumber,
          accountHolder,
        }
      });

      if (error) throw error;

      Alert.alert("Success", "Your bank details have been updated securely!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (error: any) {
      console.error("Error saving bank data:", error);
      Alert.alert("Error", error.message || "Failed to update bank info.");
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Bank Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.textSecondary }}>Loading secure details...</Text>
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
        <Text style={styles.headerTitle}>Update Bank Details</Text>
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
          {/* Security Banner */}
          <View style={styles.securityBanner}>
            <Ionicons name="lock-closed" size={20} color="#00C851" />
            <Text style={styles.securityText}>
              Your banking information is encrypted and stored securely for payouts.
            </Text>
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
              editable={!isSaving}
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
              editable={!isSaving}
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
              editable={!isSaving}
            />
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
              {isSaving ? "Saving securely..." : "Save Bank Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 81, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 81, 0.3)',
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#00C851',
    fontWeight: '500',
    lineHeight: 20,
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
});