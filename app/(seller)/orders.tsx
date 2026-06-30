// app/(seller)/orders.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const brandColor = '#4B56E9';

export default function SellerOrdersScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State to manage the currently selected order for the Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // --- Global Custom Modal State ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', onPress: () => hideAlert(), style: 'default' }]
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Load orders from Supabase
  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Mapped extra fields (price, created_at, buyer_id) needed for the details modal
        const mappedOrders = data.map((order) => ({
          id: order.id,
          product: order.product_name || 'Unknown Product',
          image: order.product_image || 'https://via.placeholder.com/150',
          status: order.status || 'Pending',
          user: order.buyer_name || 'Anonymous Buyer',
          buyer_id: order.buyer_id,
          price: order.total_price || 0,
          created_at: order.created_at,
        }));
        setOrders(mappedOrders);
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      showAlert('Error', 'Could not load your orders.');
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
      // Optimistic UI update
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      
      // Update modal state if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      showAlert('Success', `Order marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      showAlert('Error', 'Could not update order status.');
      loadOrders(); 
    }
  };

  const handleCancelAndRefund = (orderId: string | number) => {
    showAlert(
      "Cancel & Refund",
      "Are you sure you want to cancel this order? The buyer will be refunded.",
      [
        { text: "No, Go Back", style: "cancel" },
        { 
          text: "Yes, Cancel Order", 
          style: "destructive",
          onPress: () => updateOrderStatus(orderId, 'Cancelled')
        }
      ]
    );
  };

  const handleContactBuyer = async (order: any) => {
    if (!order.buyer_id) {
      showAlert('Notice', 'Cannot contact this buyer (Missing ID).');
      return;
    }
    
    try {
      setIsStartingChat(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // 1. Check if a conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('seller_id', session.user.id)
        .eq('buyer_id', order.buyer_id)
        .limit(1);

      if (fetchError) throw fetchError;

      let conversationId;

      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // 2. Create a new conversation room
        const { data: newConvo, error: insertError } = await supabase
          .from('conversations')
          .insert({
            seller_id: session.user.id,
            buyer_id: order.buyer_id,
            product_id: order.id 
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConvo.id;
      }

      setSelectedOrder(null); // Close the modal before routing

      router.push({
        pathname: '/chat-room',
        params: {
          conversationId: conversationId,
          recipientId: order.buyer_id,
          recipientNameParam: order.user,
        }
      });

    } catch (err: any) {
      console.error('Error opening chat:', err);
      showAlert('Error', 'Could not connect to the buyer right now.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#F59E0B';
      case 'Shipped': return '#3B82F6';
      case 'Completed': return '#10B981';
      case 'Cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return 'time-outline';
      case 'Shipped': return 'car-outline';
      case 'Completed': return 'checkmark-circle-outline';
      case 'Cancelled': return 'close-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      {/* Global Custom UI Modal for Alerts */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.modalOverlayAlert}>
          <View style={styles.modalAlertContainer}>
            <Text style={styles.modalAlertTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalAlertMessage}>{alertConfig.message}</Text>
            <View style={styles.modalAlertButtonGroup}>
              {alertConfig.buttons?.map((btn, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) setTimeout(btn.onPress, 100);
                  }}
                  style={[
                    styles.modalAlertBtn,
                    btn.style === 'destructive' ? styles.modalAlertBtnDestructive : 
                    btn.style === 'cancel' ? styles.modalAlertBtnCancel : styles.modalAlertBtnDefault
                  ]}
                >
                  <Text style={[
                    styles.modalAlertBtnText,
                    btn.style === 'cancel' ? { color: theme.text } : { color: '#fff' }
                  ]}>
                    {btn.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Loading Orders...</Text>
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
              <Text style={styles.sectionTitle}>Active Orders ({orders.length})</Text>
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
                        <Text style={styles.orderProduct} numberOfLines={1}>
                          {order.product}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                          <Ionicons 
                            name={getStatusIcon(order.status) as any} 
                            size={12} 
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
                          <Text style={styles.customerName} numberOfLines={1}>{order.user}</Text>
                        </View>
                        <Text style={styles.orderId}>#{String(order.id).substring(0, 8)}</Text>
                      </View>

                      {/* NEW: Replaced Inline Actions with a single "Manage Order" Button */}
                      <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => setSelectedOrder(order)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.manageButtonText}>Manage Order</Text>
                        <Ionicons name="arrow-forward" size={16} color={brandColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* --- NEW: Full-Screen Order Management Modal --- */}
      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.fullScreenModal}>
          {selectedOrder && (
            <>
              <View style={styles.fullScreenModalHeader}>
                <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.fullScreenModalTitle}>Manage Order</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalImageContainer}>
                  <Image source={{ uri: selectedOrder.image }} style={styles.modalImage} />
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                    <Text style={styles.modalStatusText}>{selectedOrder.status.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.modalProductName}>{selectedOrder.product}</Text>
                
                {/* Order Details Breakdown */}
                <View style={styles.detailsBox}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Order ID</Text>
                    <Text style={styles.modalValue}>#{String(selectedOrder.id).substring(0,8)}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Date Placed</Text>
                    <Text style={styles.modalValue}>{formatDate(selectedOrder.created_at)}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Buyer Name</Text>
                    <Text style={styles.modalValue}>{selectedOrder.user}</Text>
                  </View>

                  <View style={[styles.modalDetailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.modalLabel}>Order Total</Text>
                    <Text style={styles.modalValuePrice}>${selectedOrder.price}</Text>
                  </View>
                </View>

                {/* Management Actions */}
                <View style={styles.modalActionButtons}>
                  
                  {/* Primary Progression Actions */}
                  {selectedOrder.status === 'Pending' && (
                    <TouchableOpacity 
                      style={[styles.modalPrimaryBtn, { backgroundColor: '#3B82F6' }]} 
                      onPress={() => updateOrderStatus(selectedOrder.id, 'Shipped')}
                    >
                      <Ionicons name="car-outline" size={20} color="#fff" />
                      <Text style={styles.modalPrimaryBtnText}>Mark as Shipped</Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status === 'Shipped' && (
                    <TouchableOpacity 
                      style={[styles.modalPrimaryBtn, { backgroundColor: '#10B981' }]} 
                      onPress={() => updateOrderStatus(selectedOrder.id, 'Completed')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.modalPrimaryBtnText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  )}

                  {/* Contact Buyer */}
                  <TouchableOpacity 
                    style={styles.modalSecondaryBtn} 
                    onPress={() => handleContactBuyer(selectedOrder)}
                    disabled={isStartingChat}
                  >
                    {isStartingChat ? <ActivityIndicator size="small" color={brandColor} /> : (
                      <>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color={brandColor} />
                        <Text style={styles.modalSecondaryBtnText}>Contact Buyer</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Destructive Actions */}
                  {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Shipped') && (
                    <TouchableOpacity 
                      style={styles.modalDestructiveBtn} 
                      onPress={() => handleCancelAndRefund(selectedOrder.id)}
                    >
                      <Ionicons name="refresh-circle-outline" size={20} color="#EF4444" />
                      <Text style={styles.modalDestructiveBtnText}>Cancel & Refund Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={{ height: 60 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
      paddingTop: Platform.OS === 'ios' ? 10 : 40,
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
      backgroundColor: theme?.card ?? '#fff',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme?.border ?? '#e1e5e9',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
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
      alignItems: 'center',
    },
    orderImage: {
      width: 70,
      height: 70,
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
      marginBottom: 6,
    },
    orderProduct: {
      fontSize: 16,
      fontWeight: '700',
      color: theme?.text ?? '#1a1d21',
      flex: 1,
      marginRight: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      marginLeft: 4,
      textTransform: 'uppercase',
    },
    orderMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 10,
    },
    customerName: {
      fontSize: 14,
      color: theme?.textSecondary ?? '#6b7280',
      marginLeft: 6,
    },
    orderId: {
      fontSize: 13,
      color: theme?.textTertiary ?? '#9ca3af',
      fontWeight: '600',
    },
    manageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(75, 86, 233, 0.08)',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(75, 86, 233, 0.2)',
      marginTop: 4,
    },
    manageButtonText: {
      color: brandColor,
      fontSize: 14,
      fontWeight: '700',
      marginRight: 6,
      letterSpacing: 0.3,
    },
    bottomSpacer: {
      height: 100,
    },

    // --- Modal Styles ---
    fullScreenModal: {
      flex: 1,
      backgroundColor: theme.background,
    },
    fullScreenModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 10 : 20, 
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    fullScreenModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 20,
    },
    modalScrollContent: {
      flex: 1,
      padding: 24,
    },
    modalImageContainer: {
      alignItems: 'center',
      marginBottom: 24,
      position: 'relative',
    },
    modalImage: {
      width: width * 0.45,
      height: width * 0.45,
      borderRadius: 24,
      backgroundColor: theme.surface,
    },
    modalStatusBadge: {
      position: 'absolute',
      bottom: -10,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.background,
    },
    modalStatusText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 1,
    },
    modalProductName: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 32,
    },
    detailsBox: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalLabel: {
      fontSize: 15,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    modalValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    modalValuePrice: {
      fontSize: 18,
      fontWeight: '800',
      color: brandColor,
    },
    modalActionButtons: {
      flexDirection: 'column',
      marginTop: 32,
      gap: 12,
    },
    modalPrimaryBtn: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    modalPrimaryBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 8,
    },
    modalSecondaryBtn: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: 'rgba(75, 86, 233, 0.3)',
    },
    modalSecondaryBtnText: {
      color: brandColor,
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 8,
    },
    modalDestructiveBtn: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      marginTop: 10,
    },
    modalDestructiveBtnText: {
      color: '#EF4444',
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 8,
    },

    // Alert Modals
    modalOverlayAlert: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    modalAlertContainer: { backgroundColor: theme.card || "#fff", borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: theme.border || "#e1e5e9", shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 20 },
    modalAlertTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text || "#000", marginBottom: 8, textAlign: 'center' },
    modalAlertMessage: { fontSize: 15, color: theme.textSecondary || "#666", marginBottom: 24, textAlign: 'center', lineHeight: 22 },
    modalAlertButtonGroup: { flexDirection: 'column', gap: 12 },
    modalAlertBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    modalAlertBtnDefault: { backgroundColor: brandColor },
    modalAlertBtnDestructive: { backgroundColor: '#EF4444' },
    modalAlertBtnCancel: { backgroundColor: theme.surface || "#f0f0f0", borderWidth: 1, borderColor: theme.border || "#e1e5e9" },
    modalAlertBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });