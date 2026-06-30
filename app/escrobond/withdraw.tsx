// app/escrobond/withdraw.tsx
// Local IDE version - preview disabled
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function EscroBondWithdrawScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();

  const [deal, setDeal] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "No deal ID provided.");
      router.back();
      return;
    }

    const fetchWithdrawalData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("You must be logged in.");

        // 1. Fetch the seller's actual saved bank details
        setBankInfo({
          bankName: user.user_metadata?.bankName || "No Bank Added",
          accountNumber: user.user_metadata?.accountNumber || "0000000000",
          accountHolder: user.user_metadata?.accountHolder || "Unknown Holder"
        });

        // 2. Fetch the actual escrow deal
        const { data: dealData, error: dealError } = await supabase
          .from('escrow_bonds')
          .select('*')
          .eq('id', id as string)
          .single();

        if (dealError) throw dealError;
        setDeal(dealData);

      } catch (error: any) {
        console.error("Error fetching withdrawal data:", error);
        Alert.alert("Error", "Could not load withdrawal details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalData();
  }, [id]);

  const handleWithdraw = async () => {
    // Validate bank info exists before attempting withdrawal
    if (!bankInfo || bankInfo.bankName === "No Bank Added") {
      Alert.alert(
        "Bank Details Missing", 
        "Please add your bank details in your Store Settings before withdrawing.",
        [{ text: "Add Bank Details", onPress: () => router.push('/seller-profile-details/bank-details') }, { text: "Cancel", style: "cancel" }]
      );
      return;
    }

    setIsWithdrawing(true);
    
    try {
      // Securely update the database status to Withdrawn
      const { error } = await supabase
        .from('escrow_bonds')
        .update({ status: 'Withdrawn' })
        .eq('id', deal.id);

      if (error) throw error;

      Alert.alert(
        "Withdrawal Initiated",
        "Your funds are on the way to your bank account. It usually takes 1-2 business days to arrive.",
        [{ text: "Back to Dashboard", onPress: () => router.replace('/(seller)/dashboard') }]
      );

    } catch (err: any) {
      console.error("Withdrawal error:", err);
      Alert.alert("Error", "Could not process withdrawal. Please try again later.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const styles = createStyles(theme);

  if (loading || !deal || !bankInfo) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={brandColor} />
      </SafeAreaView>
    );
  }

  const maskAccount = (num: string) => {
    return num.length > 4 ? `•••• •••• ${num.slice(-4)}` : `•••• ${num}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available to Withdraw</Text>
          <Text style={styles.balanceAmount}>${Number(deal.amount).toLocaleString()}</Text>
          <View style={styles.readyBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.readyText}>Cleared by Buyer</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Transfer To</Text>
        <View style={styles.bankCard}>
          <View style={styles.bankIconWrapper}>
            <Ionicons name="business" size={24} color={brandColor} />
          </View>
          <View style={styles.bankDetails}>
            <Text style={styles.bankName}>{bankInfo.bankName}</Text>
            <Text style={styles.accountNumber}>{maskAccount(bankInfo.accountNumber)}</Text>
            <Text style={styles.accountHolder}>{bankInfo.accountHolder}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/seller-profile-details/bank-details')}>
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
          <Text style={styles.infoText}>
            Transfers typically arrive in your bank account within 1-2 business days.
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.primaryBtn, isWithdrawing && { opacity: 0.7 }]}
          onPress={handleWithdraw}
          disabled={isWithdrawing}
        >
          {isWithdrawing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Confirm Transfer</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.text, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  content: { flex: 1, padding: 24 },
  balanceCard: { backgroundColor: brandColor, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 32, shadowColor: brandColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500', marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: '800', marginBottom: 16, letterSpacing: -1 },
  readyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  readyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  bankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 24 },
  bankIconWrapper: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(75, 86, 233, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  bankDetails: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 2 },
  accountNumber: { fontSize: 14, color: theme.textSecondary, fontFamily: 'monospace', marginBottom: 2 },
  accountHolder: { fontSize: 12, color: theme.textTertiary },
  editBtn: { color: brandColor, fontWeight: '700', fontSize: 14, padding: 4 },
  infoBanner: { flexDirection: 'row', backgroundColor: theme.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: theme.textSecondary, lineHeight: 20 },
  bottomContainer: { padding: 24, paddingBottom: 40, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border },
  primaryBtn: { backgroundColor: brandColor, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});