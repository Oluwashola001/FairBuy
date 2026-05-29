// app/products/product-details.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

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
      Alert.alert(
        'Added to Cart!',
        `${product.name} has been added to your cart.`,
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (err) {
      console.error('Error adding to cart:', err);
      Alert.alert('Error', 'Could not add item to cart.');
    }
  };

  // Secure Chat Logic connecting to your database tables
  const handleChatWithSeller = async () => {
    if (!product.seller_id) {
      Alert.alert('Notice', 'This is a system product, you cannot chat with a seller.');
      return;
    }
    
    try {
      setIsStartingChat(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Login Required', 'You must be logged in to message the seller.');
        router.push('/auth/login');
        return;
      }

      if (user.id === product.seller_id) {
        Alert.alert('Notice', 'You cannot message yourself about your own product!');
        return;
      }

      // 1. Check if a conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
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
            buyer_id: user.id,
            seller_id: product.seller_id,
            product_id: product.id // Attach context of what they are talking about
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConvo.id;
      }

      // 3. Jump to the real-time chat room we built!
      router.push({
        pathname: '/chat-room',
        params: {
          conversationId: conversationId,
          recipientId: product.seller_id,
          recipientNameParam: "Seller", 
        }
      });

    } catch (err: any) {
      console.error('Error opening chat:', err);
      Alert.alert('Error', 'Could not connect to the seller right now. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const toggleFavorite = () => setIsFavorite(!isFavorite);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Floating Header Actions (over the image) */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFavorite}>
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#EF4444" : "#000"} 
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
              <Ionicons name="image-outline" size={80} color="#999" />
              <Text style={{ color: '#999', marginTop: 10 }}>No Image Available</Text>
            </View>
          )}
          
          {product.isUserGenerated && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Product Info - Overlapping Card */}
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

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.descriptionText}>
              {product.description || "A premium product carefully selected for you. Discover exceptional quality and craftsmanship designed to elevate your everyday experience."}
            </Text>
          </View>

          {/* Quick Details Pills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.pillsContainer}>
              <View style={styles.pill}>
                <Ionicons name="pricetag-outline" size={16} color={theme.primary ?? "#4B56E9"} />
                <Text style={styles.pillText}>{product.category}</Text>
              </View>
              {product.quantity !== undefined && (
                <View style={styles.pill}>
                  <Ionicons name="cube-outline" size={16} color={theme.primary ?? "#4B56E9"} />
                  <Text style={styles.pillText}>Stock: {product.quantity}</Text>
                </View>
              )}
              {product.delivery_method && (
                <View style={styles.pill}>
                  <Ionicons name="car-outline" size={16} color={theme.primary ?? "#4B56E9"} />
                  <Text style={styles.pillText}>{product.delivery_method}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Seller Information Card */}
          {product.isUserGenerated && (
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="storefront-outline" size={24} color="#fff" />
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>Independent Seller</Text>
                <Text style={styles.sellerLocation}>FairTrade Partner</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          )}

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
                  <Ionicons name="refresh" size={22} color="#4B56E9" />
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

          <View style={{ height: 100 }} /> 
        </View>
      </ScrollView>

      {/* Modern Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.cartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={24} color={theme.text} />
        </TouchableOpacity>

        {product.isUserGenerated && product.seller_id ? (
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={handleChatWithSeller}
            activeOpacity={0.8}
            disabled={isStartingChat}
          >
            {isStartingChat ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="chatbubbles-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Message Seller</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-check-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Buy Now</Text>
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
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    width: width,
    height: height * 0.45,
    backgroundColor: '#f3f4f6',
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
    bottom: 40,
    left: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contentContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 30,
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
    paddingRight: 16,
  },
  productName: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    marginLeft: 6,
  },
  reviewsText: {
    color: theme.textSecondary,
    fontWeight: '400',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary ?? '#4B56E9',
  },
  discountContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  discountText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary ?? '#4B56E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
    gap: 16,
  },
  cartBtn: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.primary ?? '#4B56E9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary ?? '#4B56E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonError: {
    backgroundColor: theme.primary ?? '#4B56E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonTextError: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});