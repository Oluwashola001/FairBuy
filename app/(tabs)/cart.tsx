// app/(tabs)/cart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Image,
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

  const confirmClearCart = () => {
    if (!clearCart) return;
    Alert.alert("Clear cart", "Are you sure you want to clear the cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearCart() },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const qty = item.quantity || 1;
    return (
      <View style={styles.itemRow}>
        <Image
          source={getImageSource(item.image)}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.itemDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.rowBetween}>
            <Text style={styles.itemPrice}>${(item.price || 0).toFixed(2)}</Text>
            <Text style={styles.itemUnit}>/piece</Text>
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.qtyWrapper}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleDecrease(item.id ?? index, qty)}
                accessibilityLabel="Decrease quantity"
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.qtyText}>{qty}</Text>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => handleIncrease(item.id ?? index, qty)}
                accessibilityLabel="Increase quantity"
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => removeFromCart(item.id)}
              style={styles.trashBtn}
              accessibilityLabel="Remove item"
            >
              <Ionicons name="trash-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({itemCount})</Text>
      </View>

      {/* Body */}
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>🛒 Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to see them here.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              `${item?.id ?? "item"}-${index}`
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer summary & actions */}
          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item(s) total:</Text>
              {/* ✅ FIX: show number of items */}
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>Total</Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push("/checkout")}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={confirmClearCart}>
              <Text style={styles.clearBtnText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

/* Dynamic styles based on theme */
const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background ?? "#fff",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 18,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    backBtn: {
      padding: 6,
      marginRight: 6,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme?.text ?? "#111",
    },
    listContent: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      paddingBottom: 220, // leave space for footer
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#eee",
    },
    itemImage: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: theme?.card ?? "#f2f2f2",
      marginRight: 12,
    },
    itemDetails: {
      flex: 1,
      justifyContent: "center",
    },
    itemName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme?.text ?? "#111",
      marginBottom: 4,
    },
    itemDesc: {
      fontSize: 13,
      color: theme?.textTertiary ?? "#666",
      marginBottom: 6,
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: "700",
      color: theme?.brandColor ?? "#4B56E9",
      marginRight: 8,
    },
    itemUnit: {
      fontSize: 13,
      color: theme?.textSecondary ?? "#666",
    },
    controlsRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    qtyWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme?.surface ?? "#fafafa",
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme?.border ?? "#ddd",
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    qtyBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    qtyBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme?.text ?? "#111",
    },
    qtyText: {
      minWidth: 26,
      textAlign: "center",
      fontSize: 15,
      color: theme?.text ?? "#111",
      fontWeight: "600",
    },
    trashBtn: {
      padding: 6,
      marginLeft: 8,
    },

    /* Footer */
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? "#eee",
      backgroundColor: theme?.background ?? "#fff",
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 16,
      color: theme?.textSecondary ?? "#666",
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "700",
      color: theme?.text ?? "#111",
    },
    divider: {
      height: 1,
      backgroundColor: theme?.border ?? "#eee",
      marginVertical: 8,
    },
    totalLabel: {
      fontSize: 18,
    },
    totalValue: {
      fontSize: 18,
      color: theme?.text ?? "#111",
    },

    checkoutBtn: {
      marginTop: 8,
      backgroundColor: theme?.brandColor ?? "#4B56E9",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    checkoutBtnText: {
      color: theme?.brandOnColor ?? "#fff",
      fontWeight: "700",
      fontSize: 16,
    },

    clearBtn: {
      marginTop: 10,
      backgroundColor: theme?.danger ?? "red",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    clearBtnText: {
      color: "#fff",
      fontWeight: "700",
    },

    /* Empty state */
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme?.text ?? "#111",
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme?.textSecondary ?? "#666",
      marginBottom: 16,
      textAlign: "center",
    },
    shopBtn: {
      backgroundColor: theme?.brandColor ?? "#4B56E9",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
    },
    shopBtnText: {
      color: theme?.brandOnColor ?? "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });
