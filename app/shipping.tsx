// app/shipping.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
  View,
} from "react-native";
import { useCart } from "./contexts/CartContext";
import { useTheme } from "./contexts/ThemeContext";

// Mock country data
const COUNTRIES = [
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
];

export default function ShippingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setShipping } = useCart();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phone: "",
    country: { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    saveAddress: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const styles = createStyles(theme);

  const handleChange = (field: string, value: string | boolean | any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Mock address suggestions
    if (field === 'addressLine1' && typeof value === 'string' && value.length > 3) {
      const mockSuggestions = [
        `${value} Street, ${form.city}`,
        `${value} Avenue, ${form.city}`,
        `${value} Road, ${form.city}`,
      ].filter(suggestion => form.city);
      setAddressSuggestions(mockSuggestions);
      setShowSuggestions(mockSuggestions.length > 0);
    } else if (field === 'addressLine1') {
      setShowSuggestions(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (form.country.code === 'US' && cleaned.length <= 10) {
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        return `${match[1] ? '(' + match[1] + ')' : ''}${match[2] ? ' ' + match[2] : ''}${match[3] ? '-' + match[3] : ''}`;
      }
    }
    
    return cleaned;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State/Province is required";
    if (!form.postalCode.trim()) newErrors.postalCode = "Postal code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill all form field to proceed.");
      return;
    }

    const shippingData = {
      fullName: `${form.firstName} ${form.middleName ? form.middleName + ' ' : ''}${form.lastName}`,
      email: form.email,
      phone: form.phone,
      country: form.country,
      address: form.addressLine1,
      addressLine2: form.addressLine2,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      saveAddress: form.saveAddress,
    };

    setShipping(shippingData);
    router.push("/payment");
  };

  const selectAddress = (suggestion: string) => {
    handleChange('addressLine1', suggestion.split(',')[0]);
    setShowSuggestions(false);
  };

  const renderCountryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        handleChange('country', item);
        setShowCountryModal(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>({item.code})</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shipping Address</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={theme?.brandColor ?? "#4B56E9"} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Enter first name"
                  placeholderTextColor={theme?.textSecondary ?? "#999"}
                  value={form.firstName}
                  onChangeText={(v) => handleChange("firstName", v)}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Enter last name"
                  placeholderTextColor={theme?.textSecondary ?? "#999"}
                  value={form.lastName}
                  onChangeText={(v) => handleChange("lastName", v)}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Middle Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter middle name"
                placeholderTextColor={theme?.textSecondary ?? "#999"}
                value={form.middleName}
                onChangeText={(v) => handleChange("middleName", v)}
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={20} color={theme?.brandColor ?? "#4B56E9"} />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor={theme?.textSecondary ?? "#999"}
                value={form.email}
                onChangeText={(v) => handleChange("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Enter phone number"
                placeholderTextColor={theme?.textSecondary ?? "#999"}
                value={form.phone}
                onChangeText={(v) => handleChange("phone", formatPhoneNumber(v))}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={theme?.brandColor ?? "#4B56E9"} />
              <Text style={styles.sectionTitle}>Address Details</Text>
            </View>

            {/* Country Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Country *</Text>
              <TouchableOpacity 
                style={styles.countrySelector}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={styles.countryFlag}>{form.country.flag}</Text>
                <Text style={styles.countrySelectedName}>{form.country.name}</Text>
                <Ionicons name="chevron-down" size={20} color={theme?.textSecondary ?? "#999"} />
              </TouchableOpacity>
            </View>

            {/* Address Line 1 with Suggestions */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <TextInput
                style={[styles.input, errors.addressLine1 && styles.inputError]}
                placeholder="Enter street address"
                placeholderTextColor={theme?.textSecondary ?? "#999"}
                value={form.addressLine1}
                onChangeText={(v) => handleChange("addressLine1", v)}
              />
              {errors.addressLine1 && <Text style={styles.errorText}>{errors.addressLine1}</Text>}
              
              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {addressSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectAddress(suggestion)}
                    >
                      <Ionicons name="location-outline" size={16} color={theme?.brandColor ?? "#4B56E9"} />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Apartment, suite, etc. (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Apt, suite, unit, building, floor, etc."
                placeholderTextColor={theme?.textSecondary ?? "#999"}
                value={form.addressLine2}
                onChangeText={(v) => handleChange("addressLine2", v)}
              />
            </View>

            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  placeholder="Enter city"
                  placeholderTextColor={theme?.textSecondary ?? "#999"}
                  value={form.city}
                  onChangeText={(v) => handleChange("city", v)}
                />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>State/Province *</Text>
                <TextInput
                  style={[styles.input, errors.state && styles.inputError]}
                  placeholder="State"
                  placeholderTextColor={theme?.textSecondary ?? "#999"}
                  value={form.state}
                  onChangeText={(v) => handleChange("state", v)}
                />
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Postal Code *</Text>
              <TextInput
                style={[styles.input, errors.postalCode && styles.inputError]}
                placeholder="Enter postal code"
                placeholderTextColor={theme?.textSecondary ?? "#999"}
                value={form.postalCode}
                onChangeText={(v) => handleChange("postalCode", v)}
                keyboardType="default"
              />
              {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
            </View>

            {/* Save Address Option */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleChange("saveAddress", !form.saveAddress)}
            >
              <View style={[styles.checkbox, form.saveAddress && styles.checkboxChecked]}>
                {form.saveAddress && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Save this address for future orders</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.continueBtn} 
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>Continue to Payment</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.continueBtnIcon} />
          </TouchableOpacity>
        </View>

        {/* Country Modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={theme?.text ?? "#333"} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={COUNTRIES}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
            />
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background ?? "#f8f9fa",
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme?.background ?? "#fff",
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#e1e5e9",
      marginTop: 22,
    },
    backBtn: {
      padding: 8,
      marginRight: 12,
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
      flex: 1,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: theme?.background ?? "#fff",
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
      marginLeft: 8,
    },
    nameRow: {
      flexDirection: "row",
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme?.text ?? "#1a1d21",
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme?.text ?? "#1a1d21",
      backgroundColor: theme?.surface ?? "#fff",
    },
    inputError: {
      borderColor: "#ef4444",
    },
    errorText: {
      color: "#ef4444",
      fontSize: 12,
      marginTop: 4,
    },
    countrySelector: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      borderRadius: 12,
      padding: 16,
      backgroundColor: theme?.surface ?? "#fff",
    },
    countryFlag: {
      fontSize: 20,
      marginRight: 12,
    },
    countrySelectedName: {
      flex: 1,
      fontSize: 16,
      color: theme?.text ?? "#1a1d21",
    },
    suggestionsContainer: {
      backgroundColor: theme?.surface ?? "#fff",
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      borderTopWidth: 0,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      maxHeight: 150,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#f0f2f5",
    },
    suggestionText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme?.text ?? "#1a1d21",
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme?.border ?? "#e1e5e9",
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: theme?.brandColor ?? "#4B56E9",
      borderColor: theme?.brandColor ?? "#4B56E9",
    },
    checkboxLabel: {
      fontSize: 14,
      color: theme?.textSecondary ?? "#6b7280",
    },
    bottomSpacer: {
      height: 100,
    },
    bottomContainer: {
      backgroundColor: theme?.background ?? "#fff",
      paddingHorizontal: 20,
      paddingTop: 16,
      
      
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? "#e1e5e9",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    continueBtn: {
      backgroundColor: theme?.brandColor ?? "#4B56E9",
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme?.brandColor ?? "#4B56E9",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    continueBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
      marginRight: 8,
    },
    continueBtnIcon: {
      marginLeft: 4,
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme?.background ?? "#fff",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#e1e5e9",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
    },
    modalCloseBtn: {
      padding: 8,
    },
    countryList: {
      flex: 1,
    },
    countryItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#f0f2f5",
    },
    countryName: {
      flex: 1,
      fontSize: 16,
      color: theme?.text ?? "#1a1d21",
      marginLeft: 12,
    },
    countryCode: {
      fontSize: 14,
      color: theme?.textSecondary ?? "#6b7280",
    },
  });