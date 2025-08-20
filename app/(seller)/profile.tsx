// app/(seller)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface SellerData {
  storeName: string;
  businessInfo: string;
  category: string;
  joinedDate: string;
}

export default function SellerProfile() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sellerData, setSellerData] = useState<SellerData>({
    storeName: "",
    businessInfo: "",
    category: "",
    joinedDate: "",
  });

  // Load seller data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile image (shared with buyer profile)
        const storedImage = await AsyncStorage.getItem("profileImage");
        if (storedImage) setProfileImage(storedImage);

        // Load seller details from the saved seller profile
        const storedSellerData = await AsyncStorage.getItem("sellerProfile");
        if (storedSellerData) {
          const parsedData: SellerData = JSON.parse(storedSellerData);
          setSellerData(parsedData);
        }
      } catch (error) {
        console.error("Error loading seller profile:", error);
      }
    };

    loadData();
  }, []);

  // Format joined date
  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return "May, 2025";
    
    const date = new Date(dateString);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return `${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const menuItems = [
    { 
      label: "Edit Store Info", 
      icon: "create-outline", 
      route: "/seller-profile-details/edit-store",
      iconBg: "#FF6B35",
      bgColor: isDark ? "rgba(255, 107, 53, 0.15)" : "#FFF4F2"
    },
    { 
      label: "Update Bank Details", 
      icon: "card-outline", 
      route: "/seller-profile-details/bank-details",
      iconBg: "#4B56E9",
      bgColor: isDark ? "rgba(75, 86, 233, 0.15)" : "#F4F5FF"
    },
    { 
      label: "Settings", 
      icon: "settings-outline", 
      route: "/settings",
      iconBg: "#666666",
      bgColor: isDark ? "rgba(102, 102, 102, 0.15)" : "#F5F5F5"
    },
    { 
      label: "Switch to Buyer Mode", 
      icon: "swap-horizontal-outline", 
      route: "/(tabs)/profile",
      iconBg: "#00C851",
      bgColor: isDark ? "rgba(0, 200, 81, 0.15)" : "#F1FFF4"
    },
    { 
      label: "Help & Support", 
      icon: "help-circle-outline", 
      route: "/help",
      iconBg: "#FF9500",
      bgColor: isDark ? "rgba(255, 149, 0, 0.15)" : "#FFF8F0"
    },
    { 
      label: "Logout", 
      icon: "log-out-outline", 
      route: "/auth/login", 
      danger: true,
      iconBg: "#FF3B30",
      bgColor: isDark ? "rgba(255, 59, 48, 0.15)" : "#FFF2F2"
    },
  ];

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.header}>My Seller Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {sellerData.storeName ? sellerData.storeName.charAt(0).toUpperCase() : "S"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.storeName}>
              {sellerData.storeName || "Your Store Name"}
            </Text>
            <Text style={styles.businessInfo}>
              {sellerData.businessInfo || "Your business description will appear here."}
            </Text>
            
            <View style={styles.metaInfo}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Category: </Text>
                <Text style={styles.categoryText}>
                  {sellerData.category || "Not set"}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Joined: </Text>
                <Text style={styles.joinedText}>
                  {formatJoinedDate(sellerData.joinedDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.menuItem,
                { backgroundColor: item.bgColor }
              ]}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color="white"
                />
              </View>
              
              <Text style={[
                styles.menuText, 
                item.danger && styles.dangerText
              ]}>
                {item.label}
              </Text>
              
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    backgroundColor: theme.background,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingTop: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.text,
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  profileCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.border,
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.background,
  },
  profileInfo: {
    width: "100%",
    alignItems: "center",
  },
  storeName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 8,
    textAlign: "center",
  },
  businessInfo: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  metaInfo: {
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  categoryText: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "800",
  },
  joinedText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: "800",
  },
  menuContainer: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    flex: 1,
  },
  dangerText: {
    color: theme.danger,
  },
});