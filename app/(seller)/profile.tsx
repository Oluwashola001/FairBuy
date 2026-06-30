// app/(seller)/profile.tsx
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");
const brandColor = "#4B56E9";

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
    storeName: "Loading...",
    businessInfo: "",
    category: "",
    joinedDate: "",
  });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // 1. Get Auth Data (Where the 'Become a Seller' form saves data)
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // 2. Fetch the Avatar directly from profiles table to ensure it matches the Buyer side!
            const { data: profileRow } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .single();

            if (profileRow?.avatar_url) {
              setProfileImage(profileRow.avatar_url);
            } else if (user.user_metadata?.avatar_url) {
              setProfileImage(user.user_metadata.avatar_url);
            }

            // 3. Populate all the gorgeous store info!
            setSellerData({
              storeName: user.user_metadata?.storeName || "My Store",
              businessInfo: user.user_metadata?.businessInfo || "No business description provided yet. Tap 'Edit Store Info' to tell customers about what you sell!",
              category: user.user_metadata?.category || "Uncategorized",
              joinedDate: user.user_metadata?.sellerJoinedDate || user.created_at || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("Error loading seller profile:", error);
        }
      };

      loadData();
    }, [])
  );

  const formatJoinedDate = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Absolute Hero Banner Background */}
      <View style={styles.heroBackground} />

      <SafeAreaView style={styles.safeArea}>
        {/* Transparent Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store Profile</Text>
          <TouchableOpacity 
            onPress={() => router.push('/seller-profile-details/edit-store')} 
            style={styles.iconButton}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Text style={styles.avatarText}>
                    {sellerData.storeName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            </View>

            <Text style={styles.storeName}>{sellerData.storeName}</Text>
            
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                <Ionicons name="pricetag" size={12} color="#FF6B35" style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: "#FF6B35" }]}>
                  {sellerData.category}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(75, 86, 233, 0.1)' }]}>
                <Ionicons name="calendar" size={12} color={brandColor} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: brandColor }]}>
                  Joined {formatJoinedDate(sellerData.joinedDate)}
                </Text>
              </View>
            </View>

            <Text style={styles.businessInfo} numberOfLines={3}>
              {sellerData.businessInfo}
            </Text>
          </View>

          {/* Settings Groups */}
          <Text style={styles.sectionLabel}>Store Management</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/seller-profile-details/edit-store')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                <Ionicons name="storefront" size={20} color="#FF6B35" />
              </View>
              <Text style={styles.menuItemText}>Edit Store Info</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/seller-profile-details/bank-details')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="card" size={20} color="#10B981" />
              </View>
              <Text style={styles.menuItemText}>Update Bank Details</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Account & Preferences</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                <Ionicons name="settings" size={20} color="#6B7280" />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/(tabs)/home')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(75, 86, 233, 0.1)' }]}>
                <Ionicons name="swap-horizontal" size={20} color={brandColor} />
              </View>
              <Text style={styles.menuItemText}>Switch to Buyer Mode</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/help')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="help-buoy" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: brandColor,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 55,
    paddingBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 65,
  },
  profileCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: theme.shadow?.split('(')[0] || '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: -60, // Pulls avatar up out of the card
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.card,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: brandColor,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: theme.card,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff",
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 2,
  },
  storeName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 12,
    textAlign: "center",
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  businessInfo: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: theme.card,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.card,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
});