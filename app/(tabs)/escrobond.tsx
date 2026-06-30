// app/(tabs)/escrobond.tsx
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

export default function BuyerEscroBondHub() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('escrow_bonds')
        .select('*')
        .eq('buyer_id', user.id)
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
      fetchDeals();
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
          <Text style={{ color: theme.textSecondary }}>Seller: </Text>
          @{item.seller_identifier}
        </Text>
        <Text style={[styles.statusText, item.status === 'Released' ? styles.statusGreen : styles.statusYellow]}>
          Status: <Text style={{ fontWeight: '800' }}>{item.status}</Text>
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
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
        <Text style={styles.headerTitle}>My EscroBonds</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Secure Your Deals</Text>
        <Text style={styles.heroSubtitle}>Lock funds safely for off-platform transactions.</Text>
        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => router.push({ pathname: '/escrobond/disclaimer', params: { role: 'buyer' } })}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.createBtnText}>Start New Escrow</Text>
        </TouchableOpacity>
      </View>

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
                <Ionicons name="shield-checkmark-outline" size={48} color={brandColor} />
              </View>
              <Text style={styles.emptyTitle}>No Active Deals</Text>
              <Text style={styles.emptySubtitle}>You haven't locked funds for any transactions yet.</Text>
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
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: theme?.text ?? '#1a1d21', 
    flex: 1 
  },
  heroSection: { 
    padding: 24, 
    backgroundColor: theme?.surface ?? '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: theme?.border ?? '#e1e5e9'
  },
  heroTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: theme?.text ?? '#1a1d21', 
    marginBottom: 6 
  },
  heroSubtitle: { 
    fontSize: 15, 
    color: theme?.textSecondary ?? '#6b7280', 
    marginBottom: 20,
    lineHeight: 22 
  },
  createBtn: { 
    flexDirection: 'row', 
    backgroundColor: brandColor, 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6
  },
  createBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
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
    lineHeight: 22,
    paddingHorizontal: 20
  },
});