// app/(seller)/dashboard.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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

const { width } = Dimensions.get('window');
const brandColor = "#4B56E9";

export default function SellerDashboard() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  // --- Identity & State ---
  const [profile, setProfile] = useState<{ username?: string; avatar_url?: string; store_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Metrics State ---
  const [totalSales, setTotalSales] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // --- Modal States ---
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

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Strict Active Session Check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in to access your dashboard.');
      }

      const userId = session.user.id;

      // 2. Fetch Identity
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();
      
      setProfile({
        ...profileData,
        store_name: session.user.user_metadata?.storeName || profileData?.username
      });

      // 3. Fetch Total Sales & Recent Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        // Robust case-insensitive check for pending and completed status
        const sales = ordersData
          .filter(order => order.status && order.status.toLowerCase() === 'completed')
          .reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
        
        const pendingCount = ordersData
          .filter(order => order.status && order.status.toLowerCase() === 'pending').length;

        setTotalSales(sales);
        setNewOrdersCount(pendingCount);
        
        // Mapped with extra fields for the modal
        const mappedRecent = ordersData.slice(0, 3).map(order => ({
            id: order.id,
            product: order.product_name || 'Unknown Product',
            user: order.buyer_name || 'Anonymous',
            buyer_id: order.buyer_id,
            created_at: order.created_at,
            status: order.status || 'Pending',
            statusColor: getStatusColor(order.status || 'Pending'),
            image: order.product_image || "https://via.placeholder.com/150",
            price: order.total_price || 0
        }));
        setRecentOrders(mappedRecent);
      }

      // 4. Fetch Active Products Count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);
        
      setActiveProducts(productsCount || 0);

      // 5. Fetch Real Unread Messages
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .eq('seller_id', userId);
        
      if (convos && convos.length > 0) {
          const convoIds = convos.map(c => c.id);
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convoIds)
            .eq('is_read', false)
            .neq('sender_id', userId);
            
          setUnreadMessages(unreadCount || 0);
      }

    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      showAlert('Notice', error.message || 'An unexpected error occurred while loading the dashboard.');
    }
  }, []);

  // --- Real-time Order Subscription (FIXED) ---
  useEffect(() => {
    // CRITICAL FIX: Append a unique ID (like Date.now()) to the channel name.
    // This prevents React Native Fast Refresh from trying to add callbacks to a "ghost" channel
    // that has already been subscribed to on a previous render, which caused your crash.
    const channelName = `dashboard_orders_updates_${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders'
        },
        () => {
          // Trigger a fresh fetch instantly when the database updates
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  // Initial Load
  useFocusEffect(
    useCallback(() => {
      const loadInitial = async () => {
        setLoading(true);
        await fetchDashboardData();
        setLoading(false);
      };
      loadInitial();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // --- Modal Order Handlers ---
  const updateOrderStatus = async (orderId: number | string, newStatus: string) => {
    try {
      // Optimistic update
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, statusColor: getStatusColor(newStatus) });
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      fetchDashboardData(); // Sync the rest of the dashboard
      showAlert('Success', `Order marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      showAlert('Error', 'Could not update order status.');
      fetchDashboardData(); 
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

      setSelectedOrder(null);

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
    const s = status.trim().toLowerCase();
    switch (s) {
      case 'pending': return '#F59E0B';
      case 'shipped': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const quickActions = [
    { icon: "add-circle-outline", label: "Add Product", onPress: () => router.push('/products/add-product'), color: "#10B981", bgColor: "rgba(16, 185, 129, 0.1)" },
    { icon: "cube-outline", label: "All Orders", onPress: () => router.push('/(seller)/orders'), color: "#F59E0B", bgColor: "rgba(245, 158, 11, 0.1)" },
    { icon: "chatbubbles-outline", label: "Messages", onPress: () => router.push('/(seller)/chat'), color: brandColor, bgColor: "rgba(75, 86, 233, 0.1)" },
    { icon: "shield-checkmark-outline", label: "EscroBond", onPress: () => router.push('/(seller)/escrobond'), color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.1)" },
  ];

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
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

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <Text style={styles.greeting}>Hi, {profile?.store_name || 'Seller'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(seller)/profile')}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-circle" size={44} color={brandColor} />
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={brandColor} />
            </View>
        ) : (
            <ScrollView 
              style={styles.container} 
              contentContainerStyle={styles.content} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh} 
                  tintColor={brandColor} 
                  colors={[brandColor]} 
                />
              }
            >

            {/* Dynamic Notification Banner */}
            {unreadMessages > 0 && (
                <TouchableOpacity style={styles.notificationBanner} onPress={() => router.push('/(seller)/chat')} activeOpacity={0.8}>
                    <View style={styles.bellIconContainer}>
                      <Ionicons name="notifications" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.bannerTextContainer}>
                      <Text style={styles.bannerTitle}>New Customer Inquiry</Text>
                      <Text style={styles.bannerSub}>You have {unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''} waiting.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
            )}

            {/* Premium Wallet / Earnings Hero Card */}
            <View style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Ionicons name="wallet-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.walletAmount}>
                ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              
              <TouchableOpacity 
                style={styles.withdrawBtn} 
                onPress={() => router.push('/seller-profile-details/earnings')} 
                activeOpacity={0.9}
              >
                <Text style={styles.withdrawBtnText}>Manage Earnings & Withdrawals</Text>
                <Ionicons name="arrow-forward" size={16} color={brandColor} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Grid */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                <TouchableOpacity key={index} style={styles.actionItem} onPress={action.onPress} activeOpacity={0.7}>
                    <View style={[styles.actionIconWrapper, { backgroundColor: action.bgColor }]}>
                      <Ionicons name={action.icon as any} size={24} color={action.color} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
                ))}
            </View>

            {/* Store Performance Stats */}
            <Text style={styles.sectionTitle}>Store Performance</Text>
            <View style={styles.statsContainer}>
                {/* Active Products Button */}
                <TouchableOpacity 
                  style={styles.statCard} 
                  onPress={() => router.push('/products/my-products')} 
                  activeOpacity={0.7}
                >
                    <View style={[styles.statIconBadge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                      <Ionicons name="cube" size={20} color="#10B981" />
                    </View>
                    <Text style={styles.statValue}>{activeProducts}</Text>
                    <Text style={styles.statLabel}>Active Products</Text>
                </TouchableOpacity>

                {/* Pending Orders Button */}
                <TouchableOpacity 
                  style={[styles.statCard, newOrdersCount > 0 && { borderColor: '#F59E0B', borderWidth: 2 }]} 
                  onPress={() => router.push('/(seller)/orders')} 
                  activeOpacity={0.7}
                >
                    <View style={[styles.statIconBadge, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
                      <Ionicons name="time" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.statValue}>{newOrdersCount}</Text>
                    <Text style={[styles.statLabel, newOrdersCount > 0 && { color: '#F59E0B', fontWeight: '700' }]}>Pending Orders</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Orders List */}
            <View style={styles.ordersHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {recentOrders.length > 0 && (
                  <TouchableOpacity onPress={() => router.push('/(seller)/orders')}>
                      <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                )}
            </View>
            
            <View style={styles.ordersSection}>
                {recentOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="receipt-outline" size={48} color={theme.textTertiary} />
                      <Text style={styles.emptyStateText}>No recent orders yet.</Text>
                      <Text style={styles.emptyStateSubText}>Keep promoting your products!</Text>
                    </View>
                ) : (
                    recentOrders.map((order, index) => (
                    <TouchableOpacity 
                      key={order.id} 
                      style={[styles.orderItem, index === recentOrders.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => setSelectedOrder(order)}
                      activeOpacity={0.7}
                    >
                        <Image source={{ uri: order.image }} style={styles.orderImage} />
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderProduct} numberOfLines={1}>{order.product}</Text>
                          <Text style={styles.orderUser}>{order.user}</Text>
                        </View>
                        <View style={styles.orderStatusContainer}>
                          <Text style={styles.orderPrice}>${Number(order.price).toFixed(2)}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: `${order.statusColor}15` }]}>
                            <Text style={[styles.statusText, { color: order.statusColor }]}>{order.status}</Text>
                          </View>
                        </View>
                    </TouchableOpacity>
                    ))
                )}
            </View>

            <View style={{ height: 100 }} />
            </ScrollView>
        )}
      </SafeAreaView>

      {/* --- Full-Screen Order Management Modal --- */}
      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.fullScreenModal} edges={['top']}>
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
                  <View style={[styles.modalStatusBadge, { backgroundColor: selectedOrder.statusColor }]}>
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
                  {selectedOrder.status.toLowerCase() === 'pending' && (
                    <TouchableOpacity 
                      style={[styles.modalPrimaryBtn, { backgroundColor: '#3B82F6' }]} 
                      onPress={() => updateOrderStatus(selectedOrder.id, 'Shipped')}
                    >
                      <Ionicons name="car-outline" size={20} color="#fff" />
                      <Text style={styles.modalPrimaryBtnText}>Mark as Shipped</Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status.toLowerCase() === 'shipped' && (
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
                  {(selectedOrder.status.toLowerCase() === 'pending' || selectedOrder.status.toLowerCase() === 'shipped') && (
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
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  safe: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1, backgroundColor: theme.background },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 40, paddingBottom: 20 },
  dateText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: "800", color: theme.text },
  profileBtn: { padding: 2 },
  avatarImage: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },

  notificationBanner: { flexDirection: "row", alignItems: "center", backgroundColor: theme.surface, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.3)", shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  bellIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(245, 158, 11, 0.15)", justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 16, color: theme.text, fontWeight: "700", marginBottom: 2 },
  bannerSub: { fontSize: 13, color: theme.textSecondary },
  
  walletCard: { backgroundColor: brandColor, borderRadius: 24, padding: 24, marginBottom: 32, shadowColor: brandColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500' },
  walletAmount: { color: '#fff', fontSize: 40, fontWeight: '800', marginBottom: 24, letterSpacing: -1 },
  withdrawBtn: { backgroundColor: theme.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  withdrawBtnText: { color: brandColor, fontWeight: '700', fontSize: 15 },
  
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 },
  
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionItem: { alignItems: 'center', width: '22%' },
  actionIconWrapper: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
  
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32, gap: 16 },
  statCard: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, padding: 20, borderRadius: 20, ...theme.shadow },
  statIconBadge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: "800", color: theme.text, marginBottom: 4 },
  statLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: "500" },
  
  ordersHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAllText: { color: brandColor, fontWeight: '600', fontSize: 14 },
  ordersSection: { backgroundColor: theme.surface, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: theme.border, ...theme.shadow },
  orderItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  orderImage: { width: 50, height: 50, borderRadius: 12, marginRight: 16, backgroundColor: theme.background },
  orderInfo: { flex: 1 },
  orderProduct: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 4 },
  orderUser: { fontSize: 13, color: theme.textSecondary, fontWeight: "500" },
  orderStatusContainer: { alignItems: "flex-end" },
  orderPrice: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "700" },
  
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary, marginTop: 12 },
  emptyStateSubText: { fontSize: 14, color: theme.textTertiary, marginTop: 4 },

  // Custom Alert Modal Styles
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

  // --- Full Screen Modal Styles ---
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
});