// app/products/product-details.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const brandColor = '#4B56E9';

export default function ProductDetailsScreen() {
  const { theme, isDark } = useTheme();
  const { addToCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Safely parse the product from navigation params
  let product: any = null;
  try {
    product = params.product ? JSON.parse(params.product as string) : null;
  } catch (error) {
    console.error('Error parsing product:', error);
  }
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  // Seller Profile State
  const [sellerProfile, setSellerProfile] = useState<{
    store_name?: string;
    username?: string;
    avatar_url?: string;
  } | null>(null);

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

  // Fetch real seller identity if this product belongs to a seller
  useEffect(() => {
    const fetchSeller = async () => {
      if (product?.seller_id) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('store_name, username, avatar_url')
            .eq('id', product.seller_id)
            .single();
          
          if (data) setSellerProfile(data);
        } catch (error) {
          console.error('Could not fetch seller profile', error);
        }
      }
    };
    fetchSeller();
  }, [product?.seller_id]);

  if (!product) {
    return (
      <SafeAreaView style={createStyles(theme).container}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={createStyles(theme).errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={theme.textSecondary} />
          <Text style={createStyles(theme).errorText}>Product not found</Text>
          <TouchableOpacity 
            style={createStyles(theme).backButtonError}
            onPress={() => router.back()}
          >
            <Text style={createStyles(theme).backButtonTextError}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    try {
      addToCart(product);
      showAlert(
        'Added to Cart!',
        `${product.name} has been added to your cart.`
      );
    } catch (err) {
      console.error('Error adding to cart:', err);
      showAlert('Error', 'Could not add item to cart.');
    }
  };

  // Secure Chat Logic connecting directly to seller DM with Product Context
  const handleChatWithSeller = async () => {
    if (!product.seller_id) {
      showAlert('Notice', 'This is a system product, you cannot chat with a seller.');
      return;
    }
    
    try {
      setIsStartingChat(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        showAlert('Login Required', 'You must be logged in to message the seller.', [
          { text: "Cancel", style: "cancel" },
          { text: "Login", style: "default", onPress: () => router.push('/auth/login') }
        ]);
        return;
      }

      if (session.user.id === product.seller_id) {
        showAlert('Notice', 'You cannot message yourself about your own product!');
        return;
      }

      // 1. Check if a conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', session.user.id)
        .eq('seller_id', product.seller_id)
        .limit(1);

      if (fetchError) throw fetchError;

      let conversationId;

      if (existingConversations && existingConversations.length > 0) {
        // Resume existing chat
        conversationId = existingConversations[0].id;
      } else {
        // 2. Create a new conversation room
        const { data: newConvo, error: insertError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: session.user.id,
            seller_id: product.seller_id,
            product_id: product.id 
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConvo.id;
      }

      const inquiryText = `Hi, I'm interested in this product: ${product.name}`;
      const sellerDisplayName = sellerProfile?.store_name || sellerProfile?.username || "Seller";

      // 3. Jump to the real-time chat room, passing the image and text as initial context
      router.push({
        pathname: '/chat-room',
        params: {
          conversationId: conversationId,
          recipientId: product.seller_id,
          recipientNameParam: sellerDisplayName,
          recipientAvatarParam: sellerProfile?.avatar_url || '',
          initialImageUri: product.image || '',
          initialMessage: inquiryText
        }
      });

    } catch (err: any) {
      console.error('Error opening chat:', err);
      showAlert('Error', 'Could not connect to the seller right now. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const toggleFavorite = () => setIsFavorite(!isFavorite);

  const styles = createStyles(theme);
  const sellerDisplayName = sellerProfile?.store_name || sellerProfile?.username || "Independent Seller";

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
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

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Floating Header Actions (over the image) */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#EF4444" : "#1F2937"} 
            />
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color="#9CA3AF" />
              <Text style={{ color: '#9CA3AF', marginTop: 10 }}>No Image Available</Text>
            </View>
          )}
          
          {product.isUserGenerated && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Product Info - Overlapping Premium Card */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrapper}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {product.rating || "5.0"} <Text style={styles.reviewsText}>({product.reviews || "12"} reviews)</Text>
                </Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${product.price}</Text>
              {product.discount > 0 && (
                <View style={styles.discountContainer}>
                  <Text style={styles.discountText}>{product.discount}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Details Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
            <View style={styles.pill}>
              <Ionicons name="pricetag-outline" size={16} color={brandColor} />
              <Text style={styles.pillText}>{product.category || 'General'}</Text>
            </View>
            {product.quantity !== undefined && (
              <View style={styles.pill}>
                <Ionicons name="cube-outline" size={16} color={brandColor} />
                <Text style={styles.pillText}>Stock: {product.quantity}</Text>
              </View>
            )}
            {product.delivery_method && (
              <View style={styles.pill}>
                <Ionicons name="car-outline" size={16} color={brandColor} />
                <Text style={styles.pillText}>{product.delivery_method}</Text>
              </View>
            )}
          </ScrollView>

          {/* Seller Information Card (Using Profiles Table Data) */}
          {product.seller_id && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatarWrapper}>
                {sellerProfile?.avatar_url ? (
                  <Image source={{ uri: sellerProfile.avatar_url }} style={styles.sellerAvatarImage} />
                ) : (
                  <View style={styles.sellerAvatarFallback}>
                    <Ionicons name="storefront" size={24} color={brandColor} />
                  </View>
                )}
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName} numberOfLines={1}>{sellerDisplayName}</Text>
                <Text style={styles.sellerLocation}>Verified FairTrade Seller</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            </View>
          )}

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.descriptionText}>
              {product.description || "A premium product carefully selected for you. Discover exceptional quality and craftsmanship designed to elevate your everyday experience."}
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Buy From Us</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                </View>
                <Text style={styles.featureText}>Secure</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(75, 86, 233, 0.1)' }]}>
                  <Ionicons name="refresh" size={22} color={brandColor} />
                </View>
                <Text style={styles.featureText}>Returns</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="flash" size={22} color="#F59E0B" />
                </View>
                <Text style={styles.featureText}>Fast</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} /> 
        </View>
      </ScrollView>

      {/* Modern Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.cartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={26} color={theme.text} />
        </TouchableOpacity>

        {product.seller_id ? (
          // Direct to DM Button for Seller Products
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={handleChatWithSeller}
            activeOpacity={0.9}
            disabled={isStartingChat}
          >
            {isStartingChat ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="chatbubbles" size={22} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.chatBtnText}>Chat with Seller</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          // Standard Buy Now for System Products
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={handleAddToCart}
            activeOpacity={0.9}
          >
            <Ionicons name="bag-check" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.chatBtnText}>Buy Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 45,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    width: width,
    height: height * 0.55, // Taller premium image
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  newBadge: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contentContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 36, // Deeper premium curve
    borderTopRightRadius: 36,
    marginTop: -40, // Pull up over the image further
    paddingHorizontal: 24,
    paddingTop: 36,
    minHeight: height * 0.6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 20,
  },
  productName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 10,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 6,
  },
  reviewsText: {
    color: theme.textSecondary,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: brandColor,
    letterSpacing: -1,
  },
  discountContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  discountText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 26,
  },
  pillsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 12,
  },
  pillText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sellerAvatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: theme.background,
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sellerAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: `${brandColor}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  verifiedBadge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 24,
    gap: 16,
  },
  cartBtn: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: brandColor,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  chatBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonError: {
    backgroundColor: brandColor,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  backButtonTextError: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

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
});