// Local IDE version - preview disabled
// app/escrobond/summary.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function EscroBondSummaryScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Action States
  const [cancelling, setCancelling] = useState(false);
  const [disputing, setDisputing] = useState(false);
  
  // Modal States
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [sellerResponseModalVisible, setSellerResponseModalVisible] = useState(false);
  const [sellerResponseMessage, setSellerResponseMessage] = useState('');

  // Timer State
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "No deal ID provided.");
      router.back();
      return;
    }

    const fetchDeal = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error("You must be logged in to view this deal.");
        }
        setCurrentUserId(user.id);

        const { data, error } = await supabase
          .from('escrow_bonds')
          .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
          .eq('id', id as string)
          .single();

        if (error) throw error;
        setDeal(data);
      } catch (error: any) {
        console.error("Error fetching deal:", error);
        Alert.alert("Error", "Could not load deal details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id]);

  // Live 24-Hour Countdown Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (deal?.status === 'Pending_Release' && deal?.release_initiated_at) {
      interval = setInterval(() => {
        const releaseTime = new Date(deal.release_initiated_at).getTime() + (24 * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diff = releaseTime - now;

        if (diff <= 0) {
          setTimeLeft("00h 00m 00s");
          clearInterval(interval);
        } else {
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const m = Math.floor((diff / 1000 / 60) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [deal]);

  const handleCancelDeal = () => {
    Alert.alert(
      "Cancel Deal",
      "Are you sure you want to cancel this escrow? The locked funds will be returned to your account.",
      [
        { text: "No, Keep it", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              const { error } = await supabase
                .from('escrow_bonds')
                .update({ status: 'Cancelled' })
                .eq('id', deal.id);

              if (error) throw error;
              Alert.alert("Cancelled", "The deal has been cancelled successfully.");
              setDeal({ ...deal, status: 'Cancelled' });
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to cancel deal.");
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const submitDispute = async () => {
    if (!disputeMessage.trim()) {
      Alert.alert("Required", "Please explain the issue.");
      return;
    }
    try {
      setDisputing(true);
      const { error } = await supabase
        .from('escrow_bonds')
        .update({ 
          status: 'Disputed',
          dispute_reason: disputeMessage.trim()
        })
        .eq('id', deal.id);

      if (error) throw error;
      Alert.alert("Funds Frozen", "Your transaction is now under review. Support will contact you shortly.");
      setDeal({ ...deal, status: 'Disputed', dispute_reason: disputeMessage.trim() });
      setDisputeModalVisible(false);
      setDisputeMessage('');
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to report problem.");
    } finally {
      setDisputing(false);
    }
  };

  const submitSellerResponse = async () => {
    if (!sellerResponseMessage.trim()) {
      Alert.alert("Required", "Please provide your response.");
      return;
    }
    try {
      setDisputing(true);
      const { error } = await supabase
        .from('escrow_bonds')
        .update({ 
          seller_dispute_response: sellerResponseMessage.trim()
        })
        .eq('id', deal.id);

      if (error) throw error;
      Alert.alert("Response Submitted", "Support team will review your response.");
      setDeal({ ...deal, seller_dispute_response: sellerResponseMessage.trim() });
      setSellerResponseModalVisible(false);
      setSellerResponseMessage('');
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit response.");
    } finally {
      setDisputing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const styles = createStyles(theme);

  if (loading || !deal) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={brandColor} />
      </SafeAreaView>
    );
  }

  const isBuyer = currentUserId === deal.buyer_id;
  const isSeller = currentUserId === deal.seller_id || deal.seller_identifier === currentUserId; 
  
  // Fix for the TypeScript Indexing Error
  const statusMap: Record<string, { text: string; sub: string; color: string; bgColor: string }> = {
    Locked: { text: '🔒 Locked', sub: 'Waiting for release.', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
    Pending_Release: { text: '⏳ Pending Verification', sub: 'Funds clearing.', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    Released: { text: '✅ Funds Released', sub: 'Available to withdraw.', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    Disputed: { text: '🚨 Disputed (Frozen)', sub: 'Under review by support.', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    Cancelled: { text: '❌ Cancelled', sub: 'Funds returned.', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    Withdrawn: { text: '🏦 Withdrawn', sub: 'Transferred to bank.', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' }
  };

  const statusDisplay = statusMap[deal.status] || { text: deal.status, sub: '', color: theme?.textSecondary ?? '#6b7280', bgColor: theme?.surface ?? '#fff' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={theme?.text ?? '#1a1d21'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔐 EscroBond Summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID:</Text>
            <Text style={styles.value}>{deal.transaction_id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Buyer:</Text>
            <Text style={styles.value}>@{deal.buyer?.username || 'user'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Seller:</Text>
            <Text style={styles.value}>@{deal.seller?.username || deal.seller_identifier}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.amountValue}>${Number(deal.amount).toLocaleString()}</Text>
          </View>
          {deal.reason && (
            <View style={styles.row}>
              <Text style={styles.label}>Reason:</Text>
              <Text style={styles.value}>{deal.reason}</Text>
            </View>
          )}
          <View style={styles.divider} />
          
          <View style={styles.statusRow}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusDisplay.bgColor }]}>
              <Text style={[styles.statusText, { color: statusDisplay.color }]}>{statusDisplay.text}</Text>
              <Text style={[styles.statusSubText, { color: statusDisplay.color }]}>{statusDisplay.sub}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Created:</Text>
            <Text style={styles.value}>{formatDate(deal.created_at)}</Text>
          </View>

          {/* 24 Hour Countdown Display */}
          {deal.release_initiated_at && deal.status === 'Pending_Release' && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Time Until Settlement:</Text>
              <Text style={styles.countdownValue}>{timeLeft || "Calculating..."}</Text>
            </View>
          )}

          {/* Dispute Information Display */}
          {deal.dispute_reason && (
             <View style={styles.disputeContainer}>
               <Text style={styles.disputeLabel}>Buyer's Dispute Reason:</Text>
               <Text style={styles.disputeValue}>{deal.dispute_reason}</Text>
             </View>
          )}
          {deal.seller_dispute_response && (
             <View style={[styles.disputeContainer, { backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)', marginTop: 8 }]}>
               <Text style={[styles.disputeLabel, { color: '#3B82F6' }]}>Seller's Response:</Text>
               <Text style={styles.disputeValue}>{deal.seller_dispute_response}</Text>
             </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons Pinned to Bottom */}
      <View style={styles.bottomContainer}>
        
        {/* BUYER CONTROLS */}
        {isBuyer && (
          <>
            {deal.status === 'Locked' && (
              <>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push({ pathname: '/escrobond/release', params: { id: deal.id } })}>
                  <Text style={styles.primaryBtnText}>Verify & Release Funds</Text>
                </TouchableOpacity>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginRight: 6 }]} onPress={handleCancelDeal} disabled={cancelling}>
                    <Text style={styles.secondaryBtnText}>{cancelling ? "Cancelling..." : "Cancel Deal"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginLeft: 6 }]} onPress={() => router.push('/(tabs)/escrobond')}>
                    <Ionicons name="home-outline" size={18} color={theme?.textSecondary ?? '#6b7280'} style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryBtnText}>Dashboard</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {deal.status === 'Pending_Release' && (
              <>
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                  <Text style={styles.infoText}>Funds will automatically transfer to the seller when the timer expires.</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1.2, marginRight: 6, borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} onPress={() => setDisputeModalVisible(true)} disabled={disputing}>
                    <Ionicons name="warning-outline" size={18} color="#EF4444" style={{marginRight: 6}}/>
                    <Text style={[styles.secondaryBtnText, { color: '#EF4444' }]}>{disputing ? "Freezing..." : "Report Problem"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginLeft: 6 }]} onPress={() => router.push('/(tabs)/escrobond')}>
                    <Ionicons name="home-outline" size={18} color={theme?.textSecondary ?? '#6b7280'} style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryBtnText}>Dashboard</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!['Locked', 'Pending_Release'].includes(deal.status) && (
              <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/(tabs)/escrobond')}>
                <Ionicons name="home-outline" size={20} color={theme?.textSecondary ?? '#6b7280'} style={{ marginRight: 8 }} />
                <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* SELLER CONTROLS */}
        {isSeller && (
          <>
            {deal.status === 'Disputed' ? (
              <>
                <TouchableOpacity 
                  style={[styles.primaryBtn, styles.primaryBtnDisabled]} 
                  disabled={true}
                >
                  <Ionicons name="alert-circle" size={20} color={theme?.textTertiary ?? '#999'} style={{ marginRight: 8 }} />
                  <Text style={[styles.primaryBtnText, { color: theme?.textTertiary ?? '#999' }]}>Transaction Disputed</Text>
                </TouchableOpacity>
                
                <View style={styles.actionRow}>
                  {!deal.seller_dispute_response && (
                    <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginRight: 6, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)' }]} onPress={() => setSellerResponseModalVisible(true)}>
                      <Ionicons name="chatbox-ellipses-outline" size={18} color="#3B82F6" style={{marginRight: 6}}/>
                      <Text style={[styles.secondaryBtnText, { color: '#3B82F6' }]}>Respond</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.secondaryBtn, { flex: 1, marginLeft: deal.seller_dispute_response ? 0 : 6 }]} onPress={() => router.push('/(seller)/escrobond')}>
                    <Ionicons name="home-outline" size={18} color={theme?.textSecondary ?? '#6b7280'} style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryBtnText}>Dashboard</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={[styles.primaryBtn, deal.status !== 'Released' && styles.primaryBtnDisabled]}
                  onPress={() => {
                    if (deal.status === 'Released') router.push({ pathname: '/escrobond/withdraw', params: { id: deal.id } });
                    else if (deal.status === 'Locked') Alert.alert("Funds Locked", "The buyer must verify the item and initiate the release.");
                    else if (deal.status === 'Pending_Release') Alert.alert("Funds Clearing", "The buyer has authorized the release. Funds will be available when the window closes.");
                  }}
                  activeOpacity={deal.status === 'Released' ? 0.8 : 1}
                >
                  <Ionicons name={deal.status === 'Locked' ? "lock-closed" : deal.status === 'Pending_Release' ? "hourglass-outline" : "cash-outline"} size={20} color={deal.status === 'Released' ? "#fff" : (theme?.textTertiary ?? '#999')} style={{ marginRight: 8 }} />
                  <Text style={[styles.primaryBtnText, deal.status !== 'Released' && { color: theme?.textTertiary ?? '#999' }]}>
                    {deal.status === 'Locked' ? 'Waiting for Buyer to Release...' : 
                     deal.status === 'Pending_Release' ? 'Funds Clearing (24h Window)...' : 
                     deal.status === 'Withdrawn' ? 'Funds Withdrawn' : 'Withdraw Funds'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/(seller)/escrobond')}>
                  <Ionicons name="home-outline" size={20} color={theme?.textSecondary ?? '#6b7280'} style={{ marginRight: 8 }} />
                  <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* Buyer Dispute Modal */}
      <Modal visible={disputeModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report a Problem</Text>
              <TouchableOpacity onPress={() => setDisputeModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme?.text ?? '#1a1d21'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Explain the issue below. This will freeze the funds and notify support.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="E.g. The item is damaged..."
              placeholderTextColor={theme?.textTertiary ?? '#9ca3af'}
              value={disputeMessage}
              onChangeText={setDisputeMessage}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#EF4444' }]} onPress={submitDispute} disabled={disputing}>
              <Text style={styles.modalSubmitBtnText}>{disputing ? "Submitting..." : "Freeze Funds & Submit"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Seller Response Modal */}
      <Modal visible={sellerResponseModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Respond to Dispute</Text>
              <TouchableOpacity onPress={() => setSellerResponseModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme?.text ?? '#1a1d21'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Provide your counter-claim or explanation for the support team.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your explanation here..."
              placeholderTextColor={theme?.textTertiary ?? '#9ca3af'}
              value={sellerResponseMessage}
              onChangeText={setSellerResponseMessage}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: '#3B82F6' }]} onPress={submitSellerResponse} disabled={disputing}>
              <Text style={styles.modalSubmitBtnText}>{disputing ? "Submitting..." : "Submit Response"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme?.background ?? '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 16 : 40, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme?.border ?? '#e1e5e9', backgroundColor: theme?.background ?? '#f8f9fa' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme?.text ?? '#1a1d21', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  summaryCard: { backgroundColor: theme?.surface ?? '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme?.border ?? '#e1e5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statusRow: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 16 },
  divider: { height: 1, backgroundColor: theme?.border ?? '#e1e5e9', marginVertical: 8, marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: theme?.textSecondary ?? '#6b7280', flex: 1 },
  value: { fontSize: 15, fontWeight: '600', color: theme?.text ?? '#1a1d21', flex: 1.5, textAlign: 'right', lineHeight: 22 },
  amountValue: { fontSize: 18, fontWeight: '800', color: brandColor, flex: 1.5, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)', width: '100%' },
  statusText: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statusSubText: { fontSize: 13, fontWeight: '500', opacity: 0.8 },
  countdownContainer: { marginTop: 16, padding: 16, backgroundColor: 'rgba(139, 92, 246, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)', alignItems: 'center' },
  countdownLabel: { fontSize: 13, fontWeight: '600', color: theme?.textSecondary ?? '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  countdownValue: { fontSize: 28, fontWeight: '800', color: '#8B5CF6', fontVariant: ['tabular-nums'] },
  disputeContainer: { marginTop: 16, padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  disputeLabel: { fontSize: 14, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  disputeValue: { fontSize: 14, color: theme?.text ?? '#1a1d21', lineHeight: 20 },
  
  bottomContainer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: theme?.background ?? '#fff', borderTopWidth: 1, borderTopColor: theme?.border ?? '#e1e5e9' },
  primaryBtn: { backgroundColor: brandColor, flexDirection: 'row', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, marginBottom: 12 },
  primaryBtnDisabled: { backgroundColor: theme?.surface ?? '#fff', borderWidth: 1, borderColor: theme?.border ?? '#e1e5e9', shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondaryBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme?.border ?? '#e1e5e9', backgroundColor: theme?.surface ?? '#fff' },
  secondaryBtnText: { color: theme?.textSecondary ?? '#6b7280', fontSize: 15, fontWeight: '700' },
  
  infoBanner: { flexDirection: 'row', backgroundColor: 'rgba(139, 92, 246, 0.05)', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)' },
  infoText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#8B5CF6', lineHeight: 18, fontWeight: '500' },
  
  dashboardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 4 },
  dashboardBtnText: { color: theme?.textSecondary ?? '#6b7280', fontSize: 16, fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme?.surface ?? '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme?.text ?? '#1a1d21' },
  modalSubtitle: { fontSize: 14, color: theme?.textSecondary ?? '#6b7280', marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: theme?.background ?? '#f8f9fa', borderWidth: 1, borderColor: theme?.border ?? '#e1e5e9', borderRadius: 16, padding: 16, minHeight: 120, fontSize: 16, color: theme?.text ?? '#1a1d21', marginBottom: 20 },
  modalSubmitBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalSubmitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});