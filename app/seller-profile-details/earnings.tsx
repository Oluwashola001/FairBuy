import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = "#4B56E9";

export default function SellerEarnings() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingClearance, setPendingClearance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      // Strict Session Check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication required.');

      // Fetch Orders for calculations
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (orders) {
        // Available: Orders that are Completed
        const available = orders
          .filter(o => o.status === 'Completed')
          .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        
        // Pending: Orders that are Paid but not yet Completed/Shipped
        const pending = orders
          .filter(o => o.status === 'Pending' || o.status === 'Shipped')
          .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

        setAvailableBalance(available);
        setPendingClearance(pending);

        // Map recent transactions (mocking withdrawal history from completed orders for now)
        const recentHistory = orders.slice(0, 5).map(o => ({
          id: o.id,
          type: o.status === 'Completed' ? 'Cleared' : 'Pending',
          amount: Number(o.total_price),
          date: new Date(o.created_at).toLocaleDateString(),
          color: o.status === 'Completed' ? '#10B981' : '#F59E0B'
        }));
        
        setTransactions(recentHistory);
      }
    } catch (error: any) {
      console.error(error);
      setModalMessage(error.message || "Failed to load earnings.");
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = () => {
    if (availableBalance <= 0) {
      setModalMessage("You have no available funds to withdraw.");
      setIsModalVisible(true);
      return;
    }
    // TODO: Implement Stripe Connect / Payout Logic
    setModalMessage("Withdrawal requests are currently disabled in test mode. Please contact support.");
    setIsModalVisible(true);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Custom Modal for Alerts/Notices */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 px-4">
          <View style={{ backgroundColor: theme.card }} className="rounded-3xl p-6 w-full max-w-sm shadow-xl border border-gray-200/20">
            <Text style={{ color: theme.text }} className="text-xl font-bold mb-2">Notice</Text>
            <Text style={{ color: theme.textSecondary }} className="text-base mb-6 leading-5">{modalMessage}</Text>
            <Pressable onPress={() => setIsModalVisible(false)} className="bg-indigo-600 py-3.5 rounded-xl items-center w-full active:opacity-80">
              <Text className="text-white font-bold text-base">Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings & Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <ActivityIndicator size="large" color={brandColor} />
           </View>
        ) : (
          <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Primary Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available for Withdrawal</Text>
              <Text style={styles.balanceAmount}>
                ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdrawRequest} activeOpacity={0.9}>
                <Ionicons name="cash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.withdrawBtnText}>Withdraw Funds</Text>
              </TouchableOpacity>
            </View>

            {/* Pending Clearance Card */}
            <View style={styles.pendingCard}>
              <View style={styles.pendingIconWrap}>
                <Ionicons name="time-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.pendingTextWrap}>
                <Text style={styles.pendingLabel}>Pending Clearance</Text>
                <Text style={styles.pendingSub}>Available once orders are completed</Text>
              </View>
              <Text style={styles.pendingAmount}>
                 ${pendingClearance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Transaction History */}
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.transactionsContainer}>
              {transactions.length === 0 ? (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', padding: 20 }}>No recent transactions.</Text>
              ) : (
                transactions.map((tx, index) => (
                  <View key={tx.id} style={[styles.transactionItem, index === transactions.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.txIconBadge, { backgroundColor: `${tx.color}15` }]}>
                      <Ionicons name={tx.type === 'Cleared' ? "checkmark" : "hourglass-outline"} size={18} color={tx.color} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txType}>{tx.type === 'Cleared' ? 'Funds Cleared' : 'Escrow Pending'}</Text>
                      <Text style={styles.txDate}>{tx.date}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: theme.text }]}>
                      +${tx.amount.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  safe: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },

  balanceCard: { backgroundColor: brandColor, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20, shadowColor: brandColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 48, fontWeight: '800', marginBottom: 24, letterSpacing: -1 },
  withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, width: '100%' },
  withdrawBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  pendingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 32, ...theme.shadow },
  pendingIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  pendingTextWrap: { flex: 1 },
  pendingLabel: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 2 },
  pendingSub: { fontSize: 12, color: theme.textSecondary },
  pendingAmount: { fontSize: 20, fontWeight: '800', color: theme.text },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 },
  transactionsContainer: { backgroundColor: theme.surface, borderRadius: 20, paddingHorizontal: 20, borderWidth: 1, borderColor: theme.border, ...theme.shadow },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  txIconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  txInfo: { flex: 1 },
  txType: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  txDate: { fontSize: 13, color: theme.textSecondary },
  txAmount: { fontSize: 16, fontWeight: '800' }
});