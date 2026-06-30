// app/(seller)/escrobond.tsx
// Local IDE version - preview disabled
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

// Safe image resolution for local vs bundler environments
let logoImg: any;
try {
  logoImg = require('../../assets/images/logo.png');
} catch (e) {
  logoImg = { uri: 'https://via.placeholder.com/32' };
}

export default function SellerEscroBondHub() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncomingDeals = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setLoading(false);
        return;
      }

      // We query where this user is the designated seller
      const { data, error } = await supabase
        .from('escrow_bonds')
        .select(`*, buyer:profiles!buyer_id(username)`)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchIncomingDeals();
    }, [])
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const styles = createStyles(theme);

  const renderDeal = ({ item }: { item: any }) => (
    <View style={styles.dealCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dealParty}>
          <Text style={{ color: theme?.textSecondary ?? '#6b7280' }}>Buyer: </Text>
          @{item.buyer?.username || 'user'}
        </Text>
        <Text style={[styles.statusText, item.status === 'Released' ? styles.statusGreen : styles.statusYellow]}>
          Status: <Text style={{ fontWeight: '700' }}>{item.status}</Text>
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Amount:</Text>
        <Text style={styles.amountText}>${Number(item.amount).toLocaleString()}</Text>
      </View>

      {item.reason && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reason:</Text>
          <Text style={styles.detailValue}>{item.reason}</Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Time:</Text>
        <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
      </View>

      <TouchableOpacity 
        style={styles.viewDetailsBtn}
        onPress={() => router.push({ pathname: '/escrobond/summary', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={theme?.text ?? '#1a1d21'} />
        </TouchableOpacity>
        <Image 
          source={logoImg} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
        <Text style={styles.headerTitle}>EscroBond</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Seller specific disclaimer header */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={22} color={brandColor} />
        <Text style={styles.infoText}>
          Buyers can lock funds here for your off-platform deals. Wait until status says "Locked" before delivering services or goods.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Deals</Text>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={renderDeal}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cash-outline" size={48} color={brandColor} />
              </View>
              <Text style={styles.emptyTitle}>No Incoming Deals</Text>
              <Text style={styles.emptySubtitle}>When a buyer initiates an EscroBond with you, it will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme?.background ?? '#f8f9fa'
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 16 : 40, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: theme?.border ?? '#e1e5e9',
    backgroundColor: theme?.background ?? '#f8f9fa'
  },
  backBtn: { 
    padding: 4, 
    marginRight: 8 
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: theme?.text ?? '#1a1d21', 
    flex: 1, 
  },
  infoBanner: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(75, 86, 233, 0.08)', 
    padding: 16, 
    margin: 20, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(75, 86, 233, 0.15)'
  },
  infoText: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 13, 
    color: theme?.textSecondary ?? '#6b7280', 
    lineHeight: 20,
    fontWeight: '500'
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: theme?.text ?? '#1a1d21', 
    paddingHorizontal: 20, 
    marginBottom: 8 
  },
  listContent: { 
    padding: 20, 
    paddingBottom: 100 
  },
  dealCard: { 
    backgroundColor: theme?.surface ?? '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: theme?.border ?? '#e1e5e9', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 16, 
    elevation: 4 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme?.border ?? '#e1e5e9',
    gap: 12
  },
  dealParty: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: theme?.text ?? '#1a1d21',
    flex: 1
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: '500',
    flexShrink: 0,
    textAlign: 'right'
  },
  statusGreen: { 
    color: '#10B981' 
  },
  statusYellow: { 
    color: '#F59E0B' 
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  detailLabel: { 
    width: 80, 
    fontSize: 15, 
    color: theme?.textSecondary ?? '#6b7280', 
    fontWeight: '600' 
  },
  detailValue: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '500',
    color: theme?.text ?? '#1a1d21'
  },
  amountText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: brandColor 
  },
  viewDetailsBtn: { 
    marginTop: 16, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: 'rgba(75, 86, 233, 0.2)',
    backgroundColor: 'rgba(75, 86, 233, 0.05)',
    alignItems: 'center' 
  },
  viewDetailsText: { 
    color: brandColor, 
    fontSize: 15, 
    fontWeight: '700' 
  },
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyState: { 
    alignItems: 'center', 
    marginTop: 60 
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(75, 86, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: theme?.text ?? '#1a1d21', 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 15, 
    color: theme?.textSecondary ?? '#6b7280', 
    textAlign: 'center', 
    paddingHorizontal: 20,
    lineHeight: 22
  },
});