// app/(seller)/orders.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function SellerOrdersScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load orders from Supabase
  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // 1. Get the current seller's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Fetch orders where this user is the seller
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Map the database fields to match our UI components
      if (data) {
        const mappedOrders = data.map((order) => ({
          id: order.id,
          product: order.product_name || 'Unknown Product',
          image: order.product_image || 'https://via.placeholder.com/150',
          status: order.status || 'Pending',
          user: order.buyer_name || 'Anonymous Buyer',
        }));
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      Alert.alert('Error', 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Update order status and persist to Supabase
  const updateOrderStatus = async (orderId: number | string, newStatus: string) => {
    try {
      // 1. Optimistically update the UI immediately for a snappy feel
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);

      // 2. Update the actual database record
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
    } catch (err) {
      console.error('Error updating order status:', err);
      Alert.alert('Error', 'Could not update order status.');
      // Re-load from DB to revert the optimistic UI if it failed
      loadOrders(); 
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#F59E0B';
      case 'Shipped':
        return '#3B82F6';
      case 'Completed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'time-outline';
      case 'Shipped':
        return 'car-outline';
      case 'Completed':
        return 'checkmark-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Loading Orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.section}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={theme?.textSecondary ?? '#6b7280'} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptyDescription}>
                Start adding products to your store to receive your first orders.
              </Text>
              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => router.push('/products/add-product')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addProductButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bag-handle-outline" size={20} color={theme?.primary ?? brandColor} />
              <Text style={styles.sectionTitle}>Orders ({orders.length})</Text>
            </View>

            <View style={styles.ordersContainer}>
              {orders.map((order, index) => (
                <View key={order.id} style={[
                  styles.orderCard,
                  index < orders.length - 1 && styles.orderCardBorder
                ]}>
                  <View style={styles.orderContent}>
                    <Image source={{ uri: order.image }} style={styles.orderImage} />
                    
                    <View style={styles.orderInfo}>
                      <View style={styles.orderHeader}>
                        <Text style={styles.orderProduct} numberOfLines={2}>
                          {order.product}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                          <Ionicons 
                            name={getStatusIcon(order.status) as any} 
                            size={14} 
                            color={getStatusColor(order.status)} 
                          />
                          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                            {order.status}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.orderMeta}>
                        <View style={styles.customerInfo}>
                          <Ionicons name="person-outline" size={14} color={theme?.textSecondary ?? '#6b7280'} />
                          <Text style={styles.customerName}>{order.user}</Text>
                        </View>
                        {/* Ensure we display a truncated ID if UUIDs are long */}
                        <Text style={styles.orderId}>#{String(order.id).substring(0, 6)}</Text>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.actionButtons}>
                        {order.status === 'Pending' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.shipButton]}
                            onPress={() => updateOrderStatus(order.id, 'Shipped')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="car-outline" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>Mark as Shipped</Text>
                          </TouchableOpacity>
                        )}
                        {order.status === 'Shipped' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.completeButton]}
                            onPress={() => updateOrderStatus(order.id, 'Completed')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>Mark as Completed</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background ?? '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: 40,
      backgroundColor: theme?.background ?? '#fff',
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? '#e1e5e9',
    },
    backBtn: {
      padding: 8,
      marginRight: 12,
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme?.text ?? '#1a1d21',
      flex: 1,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: theme?.background ?? '#fff',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme?.text ?? '#1a1d21',
      marginLeft: 8,
      flex: 1,
    },
    
    // Empty State
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme?.surface ?? '#f3f4f6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme?.text ?? '#1a1d21',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 15,
      color: theme?.textSecondary ?? '#6b7280',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    addProductButton: {
      backgroundColor: brandColor,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: brandColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    buttonIcon: {
      marginRight: 6,
    },
    addProductButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },

    // Orders List
    ordersContainer: {
      // Container for orders
    },
    orderCard: {
      paddingVertical: 16,
    },
    orderCardBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? '#e1e5e9',
    },
    orderContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    orderImage: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: theme?.surface ?? '#f3f4f6',
      marginRight: 16,
    },
    orderInfo: {
      flex: 1,
    },
    orderHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    orderProduct: {
      fontSize: 16,
      fontWeight: '600',
      color: theme?.text ?? '#1a1d21',
      flex: 1,
      marginRight: 12,
      lineHeight: 22,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },
    orderMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    customerName: {
      fontSize: 14,
      color: theme?.textSecondary ?? '#6b7280',
      marginLeft: 6,
    },
    orderId: {
      fontSize: 14,
      color: theme?.textSecondary ?? '#6b7280',
      fontWeight: '500',
    },
    actionButtons: {
      // Container for action buttons
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    shipButton: {
      backgroundColor: '#3B82F6',
    },
    completeButton: {
      backgroundColor: '#10B981',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    bottomSpacer: {
      height: 100,
    },
  });