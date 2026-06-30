// app/checkout.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "./contexts/CartContext";
import { useTheme } from "./contexts/ThemeContext";

// Wrap require in try/catch to handle missing assets safely across bundlers
let placeholderImg: any;
try {
  placeholderImg = require("../assets/images/placeholder.png");
} catch (error) {
  placeholderImg = { uri: "https://via.placeholder.com/150" };
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart } = useCart();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Safe image source resolver (same as cart)
  const getImageSource = (image: any) => {
    if (!image) return placeholderImg;
    if (typeof image === "string") return { uri: image };
    if (typeof image === "number") return image;
    if (typeof image === "object" && image?.uri) return image;
    return placeholderImg; 
  };

  // Count items
  const itemCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);

  // Subtotal
  const subtotal = cart.reduce(
    (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
    0
  );

  // Fixed demo costs
  const shipping = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.07;
  const total = subtotal + shipping + tax;

  const renderItem = ({ item }: { item: any }) => {
    const qty = item.quantity || 1;
    return (
      <View style={styles.itemRow}>
        <Image
          source={getImageSource(item.image)}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemQuantity}>Qty: {qty}</Text>
        </View>
        <View style={styles.itemPricing}>
          <Text style={styles.itemPrice}>${(item.price * qty).toFixed(2)}</Text>
          {qty > 1 && (
            <Text style={styles.itemUnitPrice}>${Number(item.price).toFixed(2)} each</Text>
          )}
        </View>
      </View>
    );
  };

  const handleContinue = () => {
    if (cart.length === 0) return;
    
    // We removed all the Supabase logic from here. 
    // Now it simply routes the user to the shipping details page!
    router.push("/shipping");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-check-outline" size={20} color={theme?.primary ?? "#4B56E9"} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{itemCount}</Text>
            </View>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={48} color={theme?.textSecondary ?? "#999"} />
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySubtitle}>Add some items to get started</Text>
              <TouchableOpacity 
                style={styles.continueShopping} 
                onPress={() => router.back()}
              >
                <Text style={styles.continueShoppingText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              <FlatList
                data={cart}
                renderItem={renderItem}
                keyExtractor={(item, idx) => `${item?.id ?? "item"}-${idx}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {/* Price Breakdown Section */}
        {cart.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calculator-outline" size={20} color={theme?.primary ?? "#4B56E9"} />
              <Text style={styles.sectionTitle}>Price Details</Text>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal ({itemCount} items)</Text>
                <Text style={styles.priceValue}>${subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Shipping</Text>
                <Text style={styles.priceValue}>${shipping.toFixed(2)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax (7%)</Text>
                <Text style={styles.priceValue}>${tax.toFixed(2)}</Text>
              </View>

              <View style={styles.priceDivider} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Spacer for bottom button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Checkout Button */}
      {cart.length > 0 && (
        <View style={styles.bottomContainer}>
          <View style={styles.totalSummary}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalValue}>${total.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutBtn} 
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutBtnText}>Continue to Shipping</Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color="#fff" 
              style={styles.checkoutBtnIcon} 
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background ?? "#f8f9fa",
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
    scrollContainer: {
      flex: 1,
    },
    section: {
      backgroundColor: theme?.surface ?? "#fff",
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
      marginLeft: 8,
      flex: 1,
    },
    itemCountBadge: {
      backgroundColor: theme?.primary ?? "#4B56E9",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: "center",
    },
    itemCountText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    itemsList: {
      // Container for items
    },
    itemRow: {
      flexDirection: "row",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#f0f2f5",
      alignItems: "center",
    },
    itemImage: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: theme?.background ?? "#f8f9fa",
      marginRight: 16,
    },
    itemInfo: {
      flex: 1,
      marginRight: 12,
    },
    itemName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
      marginBottom: 4,
      lineHeight: 20,
    },
    itemQuantity: {
      fontSize: 14,
      color: theme?.textSecondary ?? "#6b7280",
      fontWeight: "500",
    },
    itemPricing: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
    },
    itemUnitPrice: {
      fontSize: 12,
      color: theme?.textSecondary ?? "#6b7280",
      marginTop: 4,
    },
    priceBreakdown: {
      // Container for price rows
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
    },
    priceLabel: {
      fontSize: 15,
      color: theme?.textSecondary ?? "#6b7280",
      fontWeight: "500",
    },
    priceValue: {
      fontSize: 15,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
    },
    priceDivider: {
      height: 1,
      backgroundColor: theme?.border ?? "#e1e5e9",
      marginVertical: 12,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: "800",
      color: theme?.text ?? "#1a1d21",
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "800",
      color: theme?.primary ?? "#4B56E9",
    },
    bottomSpacer: {
      height: 150,
    },
    bottomContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme?.background ?? "#fff",
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? "#e1e5e9",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 10,
    },
    totalSummary: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    bottomTotalLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme?.textSecondary ?? "#6b7280",
    },
    bottomTotalValue: {
      fontSize: 24,
      fontWeight: "800",
      color: theme?.text ?? "#1a1d21",
    },
    checkoutBtn: {
      backgroundColor: theme?.primary ?? "#4B56E9",
      paddingVertical: 18,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme?.primary ?? "#4B56E9",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    checkoutBtnIcon: {
      marginLeft: 8,
    },
    checkoutBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      color: theme?.textSecondary ?? "#6b7280",
      marginBottom: 24,
    },
    continueShopping: {
      backgroundColor: theme?.primary ?? "#4B56E9",
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
    },
    continueShoppingText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
    },
  });