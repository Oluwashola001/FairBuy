// app/(tabs)/cart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

// Optional placeholder — keep file at this path or change the path below
import placeholderImg from "@/assets/images/placeholder.png";

export default function CartScreen() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Safe image source resolver: supports string URIs, {uri: ...}, local require() numbers
  const getImageSource = (image: any) => {
    if (!image) return placeholderImg;
    if (typeof image === "string") {
      return { uri: image };
    }
    if (typeof image === "number") {
      return image;
    }
    if (typeof image === "object") {
      if (image.uri) return image;
      return placeholderImg;
    }
    return placeholderImg;
  };

  // ✅ FIX: show item count (not $)
  const itemCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  // ✅ subtotal recalculates in real-time
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
        <View style={styles.itemImageContainer}>
          <Image
            source={getImageSource(item.image)}
            style={styles.itemImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            
            <TouchableOpacity
              onPress={() => confirmRemoveItem(item.name, item.id)}
              style={styles.removeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.itemFooter}>
            <View style={styles.priceSection}>
              <Text style={styles.unitPrice}>${(item.price || 0).toFixed(2)} each</Text>
              <Text style={styles.itemTotal}>${itemTotal.toFixed(2)}</Text>
            </View>

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
                  color={qty <= 1 ? "#d1d5db" : theme?.brandColor ?? "#4B56E9"} 
                />
              </TouchableOpacity>

              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyText}>{qty}</Text>
              </View>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleIncrease(item.id ?? index, qty)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="add" 
                  size={16} 
                  color={theme?.brandColor ?? "#4B56E9"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme?.text ?? "#1a1d21"} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cart</Text>
          {itemCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        {cart.length > 0 && (
          <TouchableOpacity onPress={confirmClearCart} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bag-outline" size={80} color={theme?.textSecondary ?? "#9ca3af"} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything to your cart yet.{"\n"}
            Start shopping to fill it up!
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/home")}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront-outline" size={20} color="#fff" style={styles.shopBtnIcon} />
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
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />

          {/* Footer summary & actions */}
          <View style={styles.footer}>
            <View style={styles.summaryContainer}>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push("/checkout")}
              activeOpacity={0.8}
            >
              <Ionicons name="card-outline" size={20} color="#fff" style={styles.checkoutBtnIcon} />
              <Text style={styles.checkoutBtnText}>
                Proceed to Checkout • ${subtotal.toFixed(2)}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

/* Dynamic styles based on theme */
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
      paddingBottom: 10,
      paddingTop: 16,
      paddingVertical: 16,
      backgroundColor: theme?.background ?? "#fff",
      borderBottomWidth: 0.5,
      borderBottomColor: theme?.border ?? "#e1e5e9",
    },
    backBtn: {
      padding: 8,
      marginRight: 12,
      borderRadius: 8,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme?.textSecondary ?? "#6b7280",
      marginTop: 2,
    },
    clearAllBtn: {
      padding: 8,
    },
    clearAllText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#ef4444",
    },
    
    listContent: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      paddingBottom: 220, // Reduced from 220 to give more space
    },
    itemSeparator: {
      height: 8, // Reduced from 12
    },
    itemCard: {
      backgroundColor: theme.background,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    itemImageContainer: {
      marginRight: 16,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: theme.background,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    itemInfo: {
      flex: 1,
      marginRight: 12,
    },
    itemName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
      marginBottom: 4,
      lineHeight: 22,
    },
    itemDesc: {
      fontSize: 14,
      color: theme?.textSecondary ?? "#6b7280",
      lineHeight: 20,
    },
    removeBtn: {
      padding: 4,
      borderRadius: 6,
      backgroundColor: "#fef2f2",
    },
    itemFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    priceSection: {
      flex: 1,
    },
    unitPrice: {
      fontSize: 13,
      color: theme?.textSecondary ?? "#6b7280",
      marginBottom: 4,
    },
    itemTotal: {
      fontSize: 18,
      fontWeight: "700",
      color: theme?.brandColor ?? "#4B56E9",
    },
    quantityControls: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.background ?? "#f8f9fa",
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
    },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    qtyBtnDisabled: {
      backgroundColor: "#f9fafb",
      shadowOpacity: 0,
      elevation: 0,
    },
    qtyDisplay: {
      minWidth: 40,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    qtyText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
    },

    /* Footer */
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? "#e1e5e9",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    summaryContainer: {
      padding: 16,
      paddingBottom: 12,
    },
    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    summaryHeaderText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
      marginLeft: 8,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 2,
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
    totalLabel: {
      fontSize: 18,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
    },
    totalValue: {
      fontSize: 20,
      fontWeight: "700",
      color: theme?.brandColor ?? "#4B56E9",
    },

    checkoutBtn: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: theme?.brandColor ?? "#4B56E9",
      paddingVertical: 14,
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
    checkoutBtnIcon: {
      marginRight: 8,
    },
    checkoutBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },

    securityNotice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 20,
      paddingTop: 8,
    },
    securityNoticeText: {
      fontSize: 12,
      color: theme?.textSecondary ?? "#6b7280",
      marginLeft: 6,
    },

    /* Empty state */
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    emptyIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme?.surface ?? "#f3f4f6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme?.text ?? "#1a1d21",
      marginBottom: 12,
    },
    emptySubtitle: {
      fontSize: 16,
      color: theme?.textSecondary ?? "#6b7280",
      marginBottom: 32,
      textAlign: "center",
      lineHeight: 24,
    },
    shopBtn: {
      backgroundColor: theme?.brandColor ?? "#4B56E9",
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: theme?.brandColor ?? "#4B56E9",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    shopBtnIcon: {
      marginRight: 8,
    },
    shopBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });