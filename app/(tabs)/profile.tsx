// app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Updated Import
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const brandColor = '#4B56E9';

export default function ProfileScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  const [isUploading, setIsUploading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  // Real User Data States
  const [userName, setUserName] = useState('Loading...');
  const [userEmail, setUserEmail] = useState('Loading...');

  // Track if user has completed seller onboarding
  const [isUserASeller, setIsUserASeller] = useState(false);

  // Database Order States
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // --- Global Custom Modal State (Replaces Alert.alert) ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', message: '' });

  const { theme, isDark } = useTheme();

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })), style: 'default' }]
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Run animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    requestPermissions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchMyOrders();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) return;

      const user = session.user;
      setUserEmail(user.email || 'No Email');

      // --- Profiles-First Architecture ---
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, is_seller') 
        .eq('id', user.id)
        .single();

      if (profileData) {
        // Set the seller flag to change the "Become Seller" button dynamically
        if (profileData.is_seller) {
          setIsUserASeller(true);
        }

        const displayUsername = profileData.username || profileData.full_name;
        if (displayUsername) {
          setUserName(displayUsername);
        } else {
          const generatedName = user.email?.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'User';
          setUserName(generatedName.charAt(0).toUpperCase() + generatedName.slice(1));
        }

        if (profileData.avatar_url) {
          setProfileImage(profileData.avatar_url);
        }
      }
    } catch (error) {
      console.error("Error fetching user identity:", error);
    }
  };

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const uploadImageToSupabase = async (uri: string) => {
    try {
      setIsUploading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("You must be logged in to upload an avatar.");
      const user = session.user;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const fileExt = uri.split('.').pop() || 'jpeg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // --- Profiles-First Architecture: Update DB, not Auth Meta ---
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImage(publicUrl);
      showAlert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert('Error', error.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== 'web') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted') {
          setPermissionsGranted(true);
        }
      } else {
        setPermissionsGranted(true);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const showImagePickerOptions = () => {
    if (!permissionsGranted && Platform.OS !== 'web') {
      showAlert(
        'Permissions Required',
        'Please grant camera and photo library permissions to update your profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permissions', style: 'default', onPress: requestPermissions }
        ]
      );
      return;
    }

    showAlert(
      "Update Profile Picture",
      "Choose how you'd like to update your profile picture",
      [
        { text: "Camera", style: "default", onPress: openCamera },
        { text: "Photo Library", style: "default", onPress: openImageLibrary },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri); 
        await uploadImageToSupabase(result.assets[0].uri);
      }
    } catch (error: any) {
      showAlert('Error', `Failed to open camera: ${error.message}`);
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await uploadImageToSupabase(result.assets[0].uri);
      }
    } catch (error: any) {
      showAlert('Error', `Failed to open photo library: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    showAlert(
      "Sign Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const handleCancelOrder = async (orderId: string) => {
    showAlert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This cannot be undone.",
      [
        { text: "No, keep it", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'Cancelled' })
                .eq('id', orderId);
              
              if (error) throw error;
              
              setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
              setSelectedOrder((prev: any) => ({ ...prev, status: 'Cancelled' }));
              
              setTimeout(() => showAlert("Success", "Your order has been cancelled."), 500);
            } catch (err: any) {
              console.error(err);
              setTimeout(() => showAlert("Error", "Could not cancel order."), 500);
            }
          }
        }
      ]
    );
  };

  const handleDeleteOrder = async (orderId: string) => {
    showAlert(
      "Delete Order",
      "Are you sure you want to permanently remove this order from your history?",
      [
        { text: "No, keep it", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);
              
              if (error) throw error;
              
              setOrders(prev => prev.filter(o => o.id !== orderId));
              setSelectedOrder(null);
              
              setTimeout(() => showAlert("Success", "Order history deleted."), 500);
            } catch (err: any) {
              console.error(err);
              setTimeout(() => showAlert("Error", "Could not delete the order."), 500);
            }
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    setSelectedOrder(null);
    router.push('/help');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const OrderItem = ({ order, index, onPress }: any) => {
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemSlideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(itemFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(itemSlideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 100);
      return () => clearTimeout(timer);
    }, []);

    const styles = createStyles(theme);

    return (
      <Animated.View
        style={[
          styles.orderItem,
          {
            opacity: itemFadeAnim,
            transform: [{ translateY: itemSlideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.orderTouchable} onPress={onPress}>
          <Image 
            source={{ uri: order.product_image || "https://via.placeholder.com/150" }} 
            style={styles.orderImage} 
          />
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle} numberOfLines={1}>{order.product_name}</Text>
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.orderPrice}>${order.total_price || 0}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary || '#999'} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Global Custom UI Modal for Alerts & Confirmations */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalAlertContainer}>
            <Text style={styles.modalAlertTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalAlertMessage}>{alertConfig.message}</Text>
            
            <View style={styles.modalAlertButtonGroup}>
              {alertConfig.buttons?.map((btn, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) {
                      // Slight delay to allow modal close animation before executing action
                      setTimeout(btn.onPress, 100);
                    }
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

      <View style={styles.heroBackground} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.placeholderIcon} />
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={[
              styles.profileCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.avatarWrapper}
              onPress={showImagePickerOptions}
              activeOpacity={0.8}
              disabled={isUploading}
            >
              <Image
                source={{ uri: profileImage }}
                style={styles.avatar}
                onError={() => {
                  setProfileImage('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
                }}
              />
              
              <View style={styles.cameraOverlay}>
                {isUploading ? (
                  <Animated.View style={styles.uploadingIndicator}>
                    <Ionicons name="cloud-upload-outline" size={14} color="#fff" />
                  </Animated.View>
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(75, 86, 233, 0.1)' }]}>
                <Ionicons name="person" size={12} color={brandColor} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: brandColor }]}>Verified Buyer</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.ordersSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionLabel}>My Recent Orders</Text>
            
            {loadingOrders ? (
              <Text style={styles.loadingText}>Loading your orders...</Text>
            ) : orders.length === 0 ? (
              <View style={styles.emptyOrdersContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="receipt-outline" size={48} color={theme.textTertiary || '#999'} />
                </View>
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptySubtitle}>Your purchases will appear here.</Text>
              </View>
            ) : (
              orders.map((order, index) => (
                <OrderItem
                  key={order.id}
                  order={order}
                  index={index}
                  onPress={() => setSelectedOrder(order)}
                />
              ))
            )}
          </Animated.View>

          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionLabel}>Account & Preferences</Text>
            <View style={styles.menuGroup}>
              {/* Dynamic Seller Button based on Profile Architecture */}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => isUserASeller ? router.push('/(seller)/dashboard') : router.push('/become-seller')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="storefront" size={20} color="#10B981" />
                </View>
                <Text style={styles.menuItemText}>{isUserASeller ? "Go to Seller Dashboard" : "Become a Seller"}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

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
                onPress={() => router.push('/help')}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="help-buoy" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.menuItemText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>

        <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.fullScreenModal}>
            {selectedOrder && (
              <>
                <View style={styles.fullScreenModalHeader}>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={styles.fullScreenModalTitle}>Order Details</Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalImageContainer}>
                    <Image source={{ uri: selectedOrder.product_image || "https://via.placeholder.com/150" }} style={styles.modalImage} />
                  </View>

                  <Text style={styles.modalProductName}>{selectedOrder.product_name}</Text>
                  
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Order ID:</Text>
                    <Text style={styles.modalValue}>#{String(selectedOrder.id).substring(0,8)}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Status:</Text>
                    <Text style={[styles.modalValue, { color: getStatusColor(selectedOrder.status) }]}>{selectedOrder.status}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Date:</Text>
                    <Text style={styles.modalValue}>{formatDate(selectedOrder.created_at)}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Total Price:</Text>
                    <Text style={styles.modalValuePrice}>${selectedOrder.total_price}</Text>
                  </View>

                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity style={styles.modalSupportBtn} onPress={handleContactSupport}>
                      <Ionicons name="headset-outline" size={18} color={theme.textSecondary} />
                      <Text style={styles.modalSupportBtnText}>Contact Support</Text>
                    </TouchableOpacity>

                    {selectedOrder.status === 'Pending' && (
                      <TouchableOpacity 
                        style={styles.modalCancelBtn} 
                        onPress={() => handleCancelOrder(selectedOrder.id)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                        <Text style={styles.modalCancelBtnText}>Cancel Order</Text>
                      </TouchableOpacity>
                    )}

                    {selectedOrder.status === 'Cancelled' && (
                      <TouchableOpacity 
                        style={styles.modalDeleteBtn} 
                        onPress={() => handleDeleteOrder(selectedOrder.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.modalDeleteBtnText}>Delete Record</Text>
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
  placeholderIcon: {
    width: 40,
    height: 40,
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
    paddingTop: 45,
  },
  
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalAlertContainer: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalAlertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalAlertMessage: {
    fontSize: 15,
    color: theme.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalAlertButtonGroup: {
    flexDirection: 'column',
    gap: 12,
  },
  modalAlertBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAlertBtnDefault: {
    backgroundColor: brandColor,
  },
  modalAlertBtnDestructive: {
    backgroundColor: '#EF4444',
  },
  modalAlertBtnCancel: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalAlertBtnText: {
    fontSize: 16,
    fontWeight: '700',
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
    marginTop: -60,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.card,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    backgroundColor: brandColor,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.card,
    elevation: 4,
  },
  uploadingIndicator: {
    transform: [{ rotate: '45deg' }],
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 6,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  ordersSection: {
    marginBottom: 24,
  },
  loadingText: {
    color: theme.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  emptyOrdersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  orderItem: {
    marginBottom: 12,
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 12,
    shadowColor: theme.shadow?.split('(')[0] || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  orderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: brandColor,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
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
  },
  modalImage: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: 20,
    backgroundColor: theme.surface,
  },
  modalProductName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  modalValuePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: brandColor,
  },
  modalActionButtons: {
    flexDirection: 'column',
    marginTop: 40,
    gap: 16,
  },
  modalSupportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalSupportBtnText: {
    marginLeft: 10,
    fontWeight: '600',
    color: theme.text,
    fontSize: 16,
  },
  modalCancelBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalCancelBtnText: {
    marginLeft: 10,
    fontWeight: '600',
    color: '#EF4444',
    fontSize: 16,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  modalDeleteBtnText: {
    marginLeft: 10,
    fontWeight: '600',
    color: '#fff',
    fontSize: 16,
  },
});