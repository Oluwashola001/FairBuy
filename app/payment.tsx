// app/payment.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useCart } from "./contexts/CartContext";
import { useTheme } from "./contexts/ThemeContext";

const brandColor = "#4B56E9";

export default function PaymentScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { cart, clearCart } = useCart(); 

  const styles = createStyles(theme);

  const [method, setMethod] = useState<"card" | "paypal" | "applepay" | "googlepay" | "cod">("card");
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

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
      buttons: buttons || [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })), style: 'default' }]
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shipping = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.07;
  const total = subtotal + shipping + tax;

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ').substring(0, 19) : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return { name: 'Visa', icon: 'card' };
    if (/^5[1-5]/.test(cleaned)) return { name: 'Mastercard', icon: 'card' };
    if (/^3[47]/.test(cleaned)) return { name: 'American Express', icon: 'card' };
    return { name: 'Card', icon: 'card' };
  };

  const validateCardForm = () => {
    const newErrors: Record<string, string> = {};
    const cleanNumber = cardForm.number.replace(/\s/g, '');

    if (!cardForm.number) {
      newErrors.number = "Card number is required";
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      newErrors.number = "Please enter a valid card number";
    }

    if (!cardForm.expiry) {
      newErrors.expiry = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) {
      newErrors.expiry = "Please enter MM/YY format";
    }

    if (!cardForm.cvv) {
      newErrors.cvv = "CVV is required";
    } else if (cardForm.cvv.length < 3 || cardForm.cvv.length > 4) {
      newErrors.cvv = "Please enter a valid CVV";
    }

    if (!cardForm.name.trim()) {
      newErrors.name = "Cardholder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardInput = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardForm(prev => ({ ...prev, [field]: formattedValue }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePay = async () => {
    if (method === "card" && !validateCardForm()) {
      showAlert("Validation Error", "Please correct the errors and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Strict Session Check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("You must be logged in to place an order.");
      }

      if (cart.length === 0) {
         throw new Error("Your cart is empty.");
      }

      const user = session.user;

      // 2. Profiles-First Architecture: Fetch verified username for order attribution
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

      // Gracefully fall back if profile data is missing or incomplete
      const buyerName = profileData?.username || profileData?.full_name || user.email?.split('@')[0] || "Anonymous Buyer";

      // 3. Format the cart items to match the Supabase 'orders' table
      const ordersToInsert = cart.map((item: any) => ({
        product_name: item.name,
        product_image: item.image || null, 
        buyer_name: buyerName, // Using verified Profiles table identity
        buyer_id: user.id, 
        total_price: (item.price || 0) * (item.quantity || 1), 
        status: 'Pending',
        seller_id: item.seller_id || null 
      }));

      // 4. Send the orders to the database!
      const { error: insertError } = await supabase
        .from('orders')
        .insert(ordersToInsert);

      if (insertError) throw insertError;

      // 5. Success! Clear the cart and navigate to the success screen
      if (clearCart) {
        clearCart();
      }
      
      setIsProcessing(false);
      router.push("/order-success");

    } catch (error: any) {
      console.error("Payment/Database Error:", error);
      showAlert("Order Failed", error.message || "We could not process your order. Please try again.");
      setIsProcessing(false);
    }
  };

  const cardType = getCardType(cardForm.number);

  return (
    <SafeAreaView style={styles.container}>
      {/* Global Custom UI Modal for Alerts */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.modalOverlay}>
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

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={brandColor} />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={20} color={brandColor} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>

            <View style={styles.paymentMethods}>
              {/* Credit/Debit Card */}
              <TouchableOpacity
                style={[styles.methodCard, method === "card" && styles.methodActive]}
                onPress={() => setMethod("card")}
                activeOpacity={0.8}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, method === "card" && styles.methodIconActive]}>
                    <Ionicons 
                      name="card-outline" 
                      size={20} 
                      color={method === "card" ? "#fff" : brandColor} 
                    />
                  </View>
                  <Text style={[styles.methodText, method === "card" && styles.methodTextActive]}>Credit / Debit Card</Text>
                </View>
                <View style={styles.methodRight}>
                  <View style={styles.textLogoContainer}><Text style={styles.textLogo}>VISA</Text></View>
                  <View style={[styles.textLogoContainer, { backgroundColor: '#EB001B' }]}><Text style={styles.textLogo}>MC</Text></View>
                </View>
              </TouchableOpacity>

              {/* Apple Pay */}
              <TouchableOpacity
                style={[styles.methodCard, method === "applepay" && styles.methodActive]}
                onPress={() => setMethod("applepay")}
                activeOpacity={0.8}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, method === "applepay" && styles.methodIconActive]}>
                    <Ionicons 
                      name="logo-apple" 
                      size={20} 
                      color={method === "applepay" ? "#fff" : brandColor} 
                    />
                  </View>
                  <Text style={[styles.methodText, method === "applepay" && styles.methodTextActive]}>Apple Pay</Text>
                </View>
                <Text style={styles.methodBadge}>Touch ID</Text>
              </TouchableOpacity>

              {/* Google Pay */}
              <TouchableOpacity
                style={[styles.methodCard, method === "googlepay" && styles.methodActive]}
                onPress={() => setMethod("googlepay")}
                activeOpacity={0.8}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, method === "googlepay" && styles.methodIconActive]}>
                    <Ionicons 
                      name="logo-google" 
                      size={20} 
                      color={method === "googlepay" ? "#fff" : brandColor} 
                    />
                  </View>
                  <Text style={[styles.methodText, method === "googlepay" && styles.methodTextActive]}>Google Pay</Text>
                </View>
                <Text style={styles.methodBadge}>Quick</Text>
              </TouchableOpacity>

              {/* PayPal */}
              <TouchableOpacity
                style={[styles.methodCard, method === "paypal" && styles.methodActive]}
                onPress={() => setMethod("paypal")}
                activeOpacity={0.8}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, method === "paypal" && styles.methodIconActive]}>
                    <Ionicons 
                      name="logo-paypal" 
                      size={20} 
                      color={method === "paypal" ? "#fff" : "#003087"} 
                    />
                  </View>
                  <Text style={[styles.methodText, method === "paypal" && styles.methodTextActive]}>PayPal</Text>
                </View>
              </TouchableOpacity>

              {/* Cash on Delivery */}
              <TouchableOpacity
                style={[styles.methodCard, method === "cod" && styles.methodActive]}
                onPress={() => setMethod("cod")}
                activeOpacity={0.8}
              >
                <View style={styles.methodLeft}>
                  <View style={[styles.methodIcon, method === "cod" && styles.methodIconActive]}>
                    <Ionicons 
                      name="cash-outline" 
                      size={20} 
                      color={method === "cod" ? "#fff" : brandColor} 
                    />
                  </View>
                  <Text style={[styles.methodText, method === "cod" && styles.methodTextActive]}>Cash on Delivery</Text>
                </View>
                <Text style={styles.methodBadge}>Pay Later</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Details Form */}
          {method === "card" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed-outline" size={20} color={brandColor} />
                <Text style={styles.sectionTitle}>Card Details</Text>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                  <Text style={styles.securityText}>Secure</Text>
                </View>
              </View>

              {/* Card Preview */}
              <View style={styles.cardPreview}>
                <View style={styles.cardPreviewHeader}>
                  <Text style={styles.cardType}>{cardType.name}</Text>
                  <Ionicons name={cardType.icon as any} size={24} color="#fff" />
                </View>
                <Text style={styles.cardNumber}>
                  {cardForm.number || "•••• •••• •••• ••••"}
                </Text>
                <View style={styles.cardPreviewFooter}>
                  <Text style={styles.cardName}>
                    {cardForm.name.toUpperCase() || "CARDHOLDER NAME"}
                  </Text>
                  <Text style={styles.cardExpiry}>
                    {cardForm.expiry || "MM/YY"}
                  </Text>
                </View>
              </View>

              {/* Card Form */}
              <View style={styles.cardFormContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={[styles.input, errors.number && styles.inputError]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={theme?.textSecondary ?? "#999"}
                    keyboardType="numeric"
                    value={cardForm.number}
                    onChangeText={(v) => handleCardInput('number', v)}
                    maxLength={19}
                  />
                  {errors.number && <Text style={styles.errorText}>{errors.number}</Text>}
                </View>

                <View style={styles.cardRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                      style={[styles.input, errors.expiry && styles.inputError]}
                      placeholder="MM/YY"
                      placeholderTextColor={theme?.textSecondary ?? "#999"}
                      keyboardType="numeric"
                      value={cardForm.expiry}
                      onChangeText={(v) => handleCardInput('expiry', v)}
                      maxLength={5}
                    />
                    {errors.expiry && <Text style={styles.errorText}>{errors.expiry}</Text>}
                  </View>

                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={[styles.input, errors.cvv && styles.inputError]}
                      placeholder="123"
                      placeholderTextColor={theme?.textSecondary ?? "#999"}
                      keyboardType="numeric"
                      secureTextEntry
                      value={cardForm.cvv}
                      onChangeText={(v) => handleCardInput('cvv', v)}
                      maxLength={4}
                    />
                    {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="John Smith"
                    placeholderTextColor={theme?.textSecondary ?? "#999"}
                    value={cardForm.name}
                    onChangeText={(v) => handleCardInput('name', v)}
                    autoCapitalize="words"
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Payment Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.payBtn, isProcessing && styles.payBtnDisabled]} 
            onPress={handlePay}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Text style={styles.payBtnText}>Processing...</Text>
              </View>
            ) : (
              <>
                <Ionicons 
                  name={method === "cod" ? "checkmark-circle-outline" : "lock-closed-outline"} 
                  size={20} 
                  color="#fff" 
                  style={styles.payBtnIcon} 
                />
                <Text style={styles.payBtnText}>
                  {method === "cod" ? `Place Order • $${total.toFixed(2)}` : `Pay Now • $${total.toFixed(2)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            <Text style={styles.securityNoticeText}>
              Your payment information is secure and encrypted
            </Text>
          </View>
        </View>
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
    // Custom Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    modalAlertContainer: {
      backgroundColor: theme?.card ?? "#fff",
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 320,
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 20,
    },
    modalAlertTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme?.text ?? "#000",
      marginBottom: 8,
      textAlign: 'center',
    },
    modalAlertMessage: {
      fontSize: 15,
      color: theme?.textSecondary ?? "#666",
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 22,
    },
    modalAlertButtonGroup: {
      flexDirection: 'column',
      gap: 12,
    },
    modalAlertBtn: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalAlertBtnDefault: {
      backgroundColor: brandColor,
    },
    modalAlertBtnDestructive: {
      backgroundColor: '#EF4444',
    },
    modalAlertBtnCancel: {
      backgroundColor: theme?.surface ?? "#f0f0f0",
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
    },
    modalAlertBtnText: {
      fontSize: 16,
      fontWeight: '700',
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme?.background ?? "#fff",
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#e1e5e9",
      marginTop: 42,
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
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
      marginLeft: 8,
      flex: 1,
    },
    securityBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ecfdf5",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    securityText: {
      fontSize: 12,
      color: "#10b981",
      fontWeight: "500",
      marginLeft: 4,
    },
    // Order Summary
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 15,
      color: theme?.textSecondary ?? "#6b7280",
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: "500",
      color: theme?.text ?? "#1a1d21",
    },
    summaryDivider: {
      height: 1,
      backgroundColor: theme?.border ?? "#e1e5e9",
      marginVertical: 12,
    },
    summaryTotalLabel: {
      fontSize: 18,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
    },
    summaryTotalValue: {
      fontSize: 18,
      fontWeight: "700",
      color: brandColor,
    },
    // Payment Methods
    paymentMethods: {
      gap: 12,
    },
    methodCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      borderRadius: 12,
      backgroundColor: theme?.surface ?? "#fff",
    },
    methodActive: {
      borderColor: brandColor,
      backgroundColor: `${brandColor}10`,
    },
    methodLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    methodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#f0f4ff",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    methodIconActive: {
      backgroundColor: brandColor,
    },
    methodText: {
      fontSize: 16,
      fontWeight: "500",
      color: theme?.text ?? "#1a1d21",
    },
    methodTextActive: {
      fontSize: 16,
      fontWeight: "600",
      color: brandColor,
    },
    methodRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    textLogoContainer: {
      backgroundColor: '#1A1F71',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      marginLeft: 6,
    },
    textLogo: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
    methodBadge: {
      backgroundColor: "#10b981",
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    // Card Preview
    cardPreview: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      backgroundColor: brandColor,
    },
    cardPreviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    cardType: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      opacity: 0.9,
    },
    cardNumber: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "600",
      letterSpacing: 2,
      marginBottom: 20,
      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    cardPreviewFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardName: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      opacity: 0.9,
      flex: 1,
    },
    cardExpiry: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      opacity: 0.9,
    },
    // Card Form
    cardFormContainer: {
      // Container for card form inputs
    },
    cardRow: {
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
    bottomSpacer: {
      height: 120,
    },
    bottomContainer: {
      backgroundColor: theme?.background ?? "#fff",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? "#e1e5e9",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    payBtn: {
      backgroundColor: brandColor,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: brandColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      marginBottom: 8,
    },
    payBtnDisabled: {
      opacity: 0.7,
    },
    payBtnIcon: {
      marginRight: 8,
    },
    payBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    processingContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    securityNotice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 0,
      paddingBottom: 4,
    },
    securityNoticeText: {
      fontSize: 12,
      color: theme?.textSecondary ?? "#6b7280",
      marginLeft: 6,
    },
  });