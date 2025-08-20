// app/products/product-details.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log('Raw params:', params);
  
  // Get product details from navigation params - FIXED ORDER
  let product = null;
  try {
    product = params.product ? JSON.parse(params.product) : null;
    console.log('Parsed product:', product);
  } catch (error) {
    console.error('Error parsing product:', error);
  }
  
  console.log('Product exists:', !!product);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) {
    return (
      <SafeAreaView style={createStyles(theme).container}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={createStyles(theme).errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={theme.textSecondary} />
          <Text style={createStyles(theme).errorText}>Product not found</Text>
          <TouchableOpacity 
            style={createStyles(theme).backButton}
            onPress={() => router.back()}
          >
            <Text style={createStyles(theme).backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    Alert.alert(
      'Added to Cart!',
      `${product.name} has been added to your cart.`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const handleBuyNow = () => {
    Alert.alert(
      'Buy Now',
      `Proceeding to checkout for ${product.name}`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Product Details</Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={toggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF6B6B" : theme.text} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {/* DEBUG LOGS FOR IMAGE */}
          {console.log('Product image URI:', product.image)}
          {console.log('Image URI type:', typeof product.image)}
          {console.log('Image URI length:', product.image?.length)}
          {console.log('Image exists check:', !!product.image)}
          
          {product.image ? (
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage}
              onError={(error) => {
                console.log('Image load error:', error.nativeEvent.error);
              }}
              onLoad={() => {
                console.log('Image loaded successfully');
              }}
              onLoadStart={() => {
                console.log('Image loading started');
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color={theme.textTertiary} />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          
          {/* "NEW" Badge for user-generated products */}
          {product.id && typeof product.id === 'string' && product.id.includes('user_') && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          {/* Title and Price */}
          <View style={styles.titleContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${product.price}</Text>
              {product.discount > 0 && (
                <View style={styles.discountContainer}>
                  <Text style={styles.discountText}>{product.discount}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Rating and Reviews */}
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(product.rating) ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {product.rating} ({product.reviews} reviews)
            </Text>
          </View>

          {/* Category */}
          <View style={styles.categoryContainer}>
            <Ionicons name="pricetag-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>

          {/* Description - Only shown for user-generated products */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailsGrid}>
              {product.quantity && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Available Quantity:</Text>
                  <Text style={styles.detailValue}>{product.quantity} units</Text>
                </View>
              )}
              
              {product.deliveryMethod && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Delivery Method:</Text>
                  <Text style={styles.detailValue}>{product.deliveryMethod}</Text>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{product.category}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Product ID:</Text>
                <Text style={styles.detailValue}>#{product.id}</Text>
              </View>
            </View>
          </View>

          {/* Seller Information - Only for user-generated products */}
          {product.id && typeof product.id === 'string' && product.id.includes('user_') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller Information</Text>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person" size={24} color={theme.textSecondary} />
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>Verified Seller</Text>
                  <Text style={styles.sellerRating}>⭐ 4.8 (256 reviews)</Text>
                  <Text style={styles.sellerLocation}>Ships nationwide</Text>
                </View>
              </View>
            </View>
          )}

          {/* Additional Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={20} color="#00C851" />
                <Text style={styles.featureText}>Verified Product</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="refresh" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>30-day Return</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="car" size={20} color="#45B7D1" />
                <Text style={styles.featureText}>Fast Delivery</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="card" size={20} color="#96CEB4" />
                <Text style={styles.featureText}>Secure Payment</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons name="basket-outline" size={20} color="#4B56E9" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buyNowButton}
          onPress={handleBuyNow}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: theme.surface,
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
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.textTertiary,
  },
  newBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#4B56E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 15,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B56E9',
    marginRight: 10,
  },
  discountContainer: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginLeft: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  sellerRating: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: '45%',
  },
  featureText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: '#4B56E9',
  },
  addToCartText: {
    color: '#4B56E9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4B56E9',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#4B56E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});