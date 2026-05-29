// app/order-success.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "./contexts/ThemeContext";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#10b981" />
        </View>
        
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your order has been placed and is being processed by the seller.
        </Text>

        <View style={styles.receiptCard}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Order Status:</Text>
            <Text style={styles.receiptValue}>Confirmed</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.secondaryBtnText}>View My Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background ?? "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme?.text ?? "#1a1d21",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: theme?.textSecondary ?? "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  receiptCard: {
    backgroundColor: theme?.surface ?? "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: theme?.border ?? "#e1e5e9",
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 15,
    color: theme?.textSecondary ?? "#6b7280",
  },
  receiptValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#10b981",
  },
  bottomContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  primaryBtn: {
    backgroundColor: theme?.brandColor ?? "#4B56E9",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme?.border ?? "#e1e5e9",
  },
  secondaryBtnText: {
    color: theme?.text ?? "#1a1d21",
    fontSize: 16,
    fontWeight: "600",
  },
});