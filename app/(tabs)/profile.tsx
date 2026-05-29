// app/(tabs)/profile.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

  // Database Order States
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For the details modal
  
  const { theme, isDark } = useTheme();

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

  // Fetch data EVERY TIME the screen is viewed
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchMyOrders();
    }, [])
  );

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || 'No Email');
      
      const generatedName = user.email?.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'User';
      const capitalizedName = generatedName.charAt(0).toUpperCase() + generatedName.slice(1);
      setUserName(user.user_metadata?.full_name || capitalizedName);

      if (user.user_metadata?.avatar_url) {
        setProfileImage(user.user_metadata.avatar_url);
      }
    }
  };

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user.id)
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload an avatar.");

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

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setProfileImage(publicUrl);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload image.');
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
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to update your profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permissions', onPress: requestPermissions }
        ]
      );
      return;
    }

    Alert.alert(
      "Update Profile Picture",
      "Choose how you'd like to update your profile picture",
      [
        { text: "Camera", onPress: openCamera, style: "default" },
        { text: "Photo Library", onPress: openImageLibrary, style: "default" },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri); 
        await uploadImageToSupabase(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to open camera: ${error.message}`);
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await uploadImageToSupabase(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to open photo library: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
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

  // E-commerce Action: Cancel Order
  const handleCancelOrder = async (orderId: string) => {
    Alert.alert(
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
              
              // Update local state for immediate UI feedback
              setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
              setSelectedOrder((prev: any) => ({ ...prev, status: 'Cancelled' }));
              
              Alert.alert("Success", "Your order has been cancelled.");
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", "Could not cancel order.");
            }
          }
        }
      ]
    );
  };

  // NEW E-commerce Action: Delete Order (Only for Cancelled Orders)
  const handleDeleteOrder = async (orderId: string) => {
    Alert.alert(
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
              
              // Update local state to remove the order entirely
              setOrders(prev => prev.filter(o => o.id !== orderId));
              setSelectedOrder(null);
              
              Alert.alert("Success", "Order history deleted.");
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", "Could not delete the order.");
            }
          }
        }
      ]
    );
  };

  // E-commerce Action: Contact Support
  const handleContactSupport = () => {
    setSelectedOrder(null);
    router.push('/help');
  };

  // Helper for displaying beautiful dates
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
          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* User Profile Section */}
        <Animated.View
          style={[
            styles.userSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.avatarContainer}
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
            <View style={styles.avatarGlow} />
            
            {/* Camera Icon Overlay */}
            <View style={styles.cameraOverlay}>
              {isUploading ? (
                <Animated.View style={styles.uploadingIndicator}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                </Animated.View>
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
            <TouchableOpacity style={styles.editProfileButton} onPress={showImagePickerOptions}>
              <Text style={styles.editProfileText}>
                {isUploading ? 'Uploading...' : 'Tap to edit photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dynamic My Orders Section */}
        <Animated.View
          style={[
            styles.ordersSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>My Orders</Text>
          
          {loadingOrders ? (
            <Text style={styles.loadingText}>Loading your orders...</Text>
          ) : orders.length === 0 ? (
            <View style={styles.emptyOrdersContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={theme.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
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

        {/* Switch to Seller Mode Button */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.sellerModeButton} onPress={() => router.push('/become-seller')}>
            <Text style={styles.sellerModeText}>Switch to Seller Mode</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Help & Support */}
        <Animated.View
          style={[
            styles.helpSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.helpButton} onPress={() => router.push('/help')}>
            <View style={styles.helpContent}>
              <View style={styles.helpIconContainer}>
                <Ionicons name="logo-facebook" size={20} color={brandColor} />
              </View>
              <Text style={styles.helpText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Sign Out Button */}
        <Animated.View
          style={[
            styles.signOutSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Full Screen Order Details Modal */}
      <Modal visible={!!selectedOrder} animationType="slide">
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

                  {/* Only allow cancellation if order is Pending */}
                  {selectedOrder.status === 'Pending' && (
                    <TouchableOpacity 
                      style={styles.modalCancelBtn} 
                      onPress={() => handleCancelOrder(selectedOrder.id)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                      <Text style={styles.modalCancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}

                  {/* Only show Delete button if the order has already been Cancelled */}
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
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>

    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.surface,
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 44,
    backgroundColor: brandColor,
    opacity: 0.1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    backgroundColor: brandColor,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadingIndicator: {
    transform: [{ rotate: '45deg' }],
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  editProfileButton: {
    paddingVertical: 2,
  },
  editProfileText: {
    fontSize: 12,
    color: brandColor,
    fontWeight: '500',
  },
  ordersSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 20,
  },
  loadingText: {
    color: theme.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic'
  },
  emptyOrdersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
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
    marginBottom: 16,
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 10,
    ...theme.shadow,
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
    fontSize: 14,
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
    fontWeight: '700',
    color: brandColor,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  buttonSection: {
    marginBottom: 24,
  },
  sellerModeButton: {
    backgroundColor: brandColor,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 0,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sellerModeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  helpSection: {
    marginBottom: 24,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  signOutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '800',
  },
  
  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: theme.background,
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Add padding for non-SafeArea devices
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