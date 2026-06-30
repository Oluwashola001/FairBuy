// app/(tabs)/cart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";

// Wrap require in try/catch to handle missing assets safely across bundlers
let placeholderImg: any;
try {
  placeholderImg = require("../../assets/images/placeholder.png");
} catch (error) {
  placeholderImg = { uri: "https://via.placeholder.com/150" };
}

const brandColor = "#4B56E9";

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);

  // Safe image source resolver
  const getImageSource = (image: any) => {
    if (!image) return placeholderImg;
    if (typeof image === "string") return { uri: image };
    if (typeof image === "number") return image;
    if (typeof image === "object" && image?.uri) return image;
    return placeholderImg; 
  };

  const itemCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const subtotal = cart.reduce(
    (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
    0
  );

  const handleDecrease = (id: any, currentQty: number) => {
    const newQty = Math.max((currentQty || 1) - 1, 1);
    updateQuantity?.(id, newQty);
  };

  const handleIncrease = (id: any, currentQty: number) => {
    const newQty = (currentQty || 1) + 1;
    updateQuantity?.(id, newQty);
  };

  const confirmRemoveItem = (itemName: string, itemId: any) => {
    Alert.alert(
      "Remove Item",
      `Remove "${itemName}" from cart?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeFromCart(itemId) },
      ]
    );
  };

  const confirmClearCart = () => {
    if (!clearCart) return;
    Alert.alert("Clear Cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearCart() },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const qty = item.quantity || 1;
    const itemTotal = (item.price || 0) * qty;

    return (
      <View style={styles.itemCard}>
        <Image
          source={getImageSource(item.image)}
          style={styles.itemImage}
          resizeMode="cover"
        />
        
        <View style={styles.itemContent}>
          {/* Top Row: Name and Total Price (Separated!) */}
          <View style={styles.itemTopRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.itemTotalPrice}>${itemTotal.toFixed(2)}</Text>
          </View>

          {/* Middle Row: Unit Price */}
          <Text style={styles.itemUnitPrice}>${(item.price || 0).toFixed(2)} each</Text>

          {/* Bottom Row: Quantity Controls (Left) & Trash (Right) */}
          <View style={styles.itemBottomRow}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                onPress={() => handleDecrease(item.id ?? index, qty)}
                disabled={qty <= 1}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="remove" 
                  size={16} 
                  color={qty <= 1 ? theme.textTertiary : theme.text} 
                />
              </TouchableOpacity>

              <Text style={styles.qtyText}>{qty}</Text>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleIncrease(item.id ?? index, qty)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="add" 
                  size={16} 
                  color={theme.text} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => confirmRemoveItem(item.name, item.id)}
              style={styles.removeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          {itemCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        {cart.length > 0 ? (
          <TouchableOpacity onPress={confirmClearCart} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} /> // Spacer to balance header
        )}
      </View>

      {/* Body */}
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={60} color={brandColor} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything to your cart yet. Start shopping!
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)/home")}
            activeOpacity={0.8}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item?.id ?? "item"}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Premium Anchored Footer */}
          <View style={styles.bottomContainer}>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryLabel}>Total Payment</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push("/checkout")}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutBtnText}>Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.checkoutBtnIcon} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
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
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      zIndex: 10,
      marginTop: 42,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: "500",
      marginTop: 2,
    },
    clearAllBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
    },
    clearAllText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#ef4444",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 24, 
      paddingBottom: 140, 
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 24, // Premium rounded corners
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow?.split('(')[0] || '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    itemImage: {
      width: 96,
      height: 96,
      borderRadius: 16,
      backgroundColor: theme.background,
    },
    itemContent: {
      flex: 1,
      marginLeft: 16,
      justifyContent: 'space-between',
    },
    itemTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    itemName: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginRight: 12,
      lineHeight: 22,
    },
    itemTotalPrice: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
    },
    itemUnitPrice: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.textSecondary,
      marginTop: 2,
      marginBottom: 12,
    },
    itemBottomRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    removeBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityControls: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    qtyBtnDisabled: {
      backgroundColor: theme.background,
      shadowOpacity: 0,
      elevation: 0,
    },
    qtyText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginHorizontal: 16,
      minWidth: 20,
      textAlign: 'center',
    },
    bottomContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.background,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 40,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 10,
    },
    summaryContainer: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: "500",
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.text,
    },
    checkoutBtn: {
      backgroundColor: brandColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      shadowColor: brandColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    checkoutBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    checkoutBtnIcon: {
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(75, 86, 233, 0.1)',
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 12,
    },
    emptySubtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 32,
    },
    shopBtn: {
      backgroundColor: brandColor,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 16,
      shadowColor: brandColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    shopBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });