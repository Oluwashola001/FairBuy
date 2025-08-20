// app/(tabs)/home.tsx
import {
  Ionicons
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Import theme context
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const brandColor = '#4B56E9';

// Dummy product data with all categories (kept for beautification)
const hardcodedProducts = [
  // Electronic
  { id: 1, name: 'iPhone 14 Pro Max', price: 799, category: 'Electronic', image: null, rating: 4.8, reviews: 234, discount: 10 },
  { id: 2, name: 'PlayStation 5', price: 399, category: 'Electronic', image: null, rating: 4.9, reviews: 567, discount: 0 },
  { id: 3, name: 'Samsung Galaxy Watch', price: 299, category: 'Electronic', image: null, rating: 4.6, reviews: 123, discount: 15 },
  { id: 4, name: 'MacBook Air M2', price: 1199, category: 'Electronic', image: null, rating: 4.7, reviews: 89, discount: 8 },
  { id: 5, name: 'AirPods Pro', price: 249, category: 'Electronic', image: null, rating: 4.5, reviews: 456, discount: 20 },
  { id: 6, name: 'iPad Pro 12.9"', price: 899, category: 'Electronic', image: null, rating: 4.8, reviews: 178, discount: 12 },
  
  // Fashion
  { id: 7, name: 'Designer Sneakers', price: 150, category: 'Fashion', image: null, rating: 4.4, reviews: 78, discount: 25 },
  { id: 8, name: 'Leather Jacket', price: 89, category: 'Fashion', image: null, rating: 4.6, reviews: 145, discount: 0 },
  { id: 9, name: 'Summer Dress', price: 45, category: 'Fashion', image: null, rating: 4.3, reviews: 67, discount: 30 },
  { id: 10, name: 'Denim Jeans', price: 65, category: 'Fashion', image: null, rating: 4.5, reviews: 234, discount: 15 },
  { id: 11, name: 'Silk Scarf', price: 35, category: 'Fashion', image: null, rating: 4.2, reviews: 45, discount: 0 },
  { id: 12, name: 'Winter Coat', price: 120, category: 'Fashion', image: null, rating: 4.7, reviews: 89, discount: 18 },
  
  // Beauty
  { id: 13, name: 'Skincare Set', price: 75, category: 'Beauty', image: null, rating: 4.8, reviews: 189, discount: 22 },
  { id: 14, name: 'Makeup Palette', price: 55, category: 'Beauty', image: null, rating: 4.7, reviews: 156, discount: 0 },
  { id: 15, name: 'Hair Serum', price: 25, category: 'Beauty', image: null, rating: 4.4, reviews: 78, discount: 35 },
  { id: 16, name: 'Face Mask Set', price: 30, category: 'Beauty', image: null, rating: 4.6, reviews: 123, discount: 20 },
  { id: 17, name: 'Perfume Collection', price: 120, category: 'Beauty', image: null, rating: 4.5, reviews: 89, discount: 10 },
  { id: 18, name: 'Lip Gloss Set', price: 40, category: 'Beauty', image: null, rating: 4.3, reviews: 145, discount: 15 },
  
  // Health
  { id: 19, name: 'Vitamin C Supplement', price: 25, category: 'Health', image: null, rating: 4.6, reviews: 234, discount: 0 },
  { id: 20, name: 'Protein Powder', price: 60, category: 'Health', image: null, rating: 4.7, reviews: 156, discount: 20 },
  { id: 21, name: 'First Aid Kit', price: 35, category: 'Health', image: null, rating: 4.4, reviews: 89, discount: 15 },
  { id: 22, name: 'Blood Pressure Monitor', price: 85, category: 'Health', image: null, rating: 4.8, reviews: 67, discount: 12 },
  
  // Sports
  { id: 23, name: 'Basketball', price: 40, category: 'Sports', image: null, rating: 4.5, reviews: 123, discount: 0 },
  { id: 24, name: 'Tennis Racket', price: 120, category: 'Sports', image: null, rating: 4.7, reviews: 89, discount: 18 },
  { id: 25, name: 'Soccer Ball', price: 30, category: 'Sports', image: null, rating: 4.6, reviews: 234, discount: 25 },
  { id: 26, name: 'Golf Club Set', price: 350, category: 'Sports', image: null, rating: 4.8, reviews: 45, discount: 10 },
  
  // Fitness
  { id: 27, name: 'Yoga Mat', price: 25, category: 'Fitness', image: null, rating: 4.4, reviews: 178, discount: 20 },
  { id: 28, name: 'Dumbbells Set', price: 80, category: 'Fitness', image: null, rating: 4.6, reviews: 123, discount: 15 },
  { id: 29, name: 'Resistance Bands', price: 20, category: 'Fitness', image: null, rating: 4.3, reviews: 156, discount: 30 },
  { id: 30, name: 'Exercise Bike', price: 299, category: 'Fitness', image: null, rating: 4.7, reviews: 67, discount: 12 },
  
  // Appliance
  { id: 31, name: 'Coffee Maker', price: 89, category: 'Appliance', image: null, rating: 4.5, reviews: 234, discount: 0 },
  { id: 32, name: 'Air Fryer', price: 120, category: 'Appliance', image: null, rating: 4.8, reviews: 189, discount: 22 },
  { id: 33, name: 'Blender', price: 65, category: 'Appliance', image: null, rating: 4.4, reviews: 145, discount: 18 },
  { id: 34, name: 'Microwave Oven', price: 180, category: 'Appliance', image: null, rating: 4.6, reviews: 78, discount: 15 },
  
  // Jewelry
  { id: 35, name: 'Diamond Ring', price: 899, category: 'Jewelry', image: null, rating: 4.9, reviews: 45, discount: 0 },
  { id: 36, name: 'Gold Necklace', price: 299, category: 'Jewelry', image: null, rating: 4.7, reviews: 89, discount: 10 },
  { id: 37, name: 'Silver Bracelet', price: 120, category: 'Jewelry', image: null, rating: 4.5, reviews: 123, discount: 25 },
  { id: 38, name: 'Pearl Earrings', price: 199, category: 'Jewelry', image: null, rating: 4.6, reviews: 67, discount: 15 },
  
  // Furniture
  { id: 39, name: 'Ergonomic Chair', price: 230, category: 'Furniture', image: null, rating: 4.7, reviews: 89, discount: 15 },
  { id: 40, name: 'Coffee Table', price: 180, category: 'Furniture', image: null, rating: 4.6, reviews: 156, discount: 20 },
  { id: 41, name: 'Bookshelf', price: 150, category: 'Furniture', image: null, rating: 4.4, reviews: 234, discount: 18 },
  { id: 42, name: 'Dining Set', price: 450, category: 'Furniture', image: null, rating: 4.8, reviews: 67, discount: 12 },
  
  // Gaming
  { id: 43, name: 'Gaming Headset', price: 89, category: 'Gaming', image: null, rating: 4.6, reviews: 234, discount: 20 },
  { id: 44, name: 'Mechanical Keyboard', price: 120, category: 'Gaming', image: null, rating: 4.7, reviews: 145, discount: 15 },
  { id: 45, name: 'Gaming Mouse', price: 65, category: 'Gaming', image: null, rating: 4.5, reviews: 189, discount: 25 },
  { id: 46, name: 'Gaming Chair', price: 299, category: 'Gaming', image: null, rating: 4.8, reviews: 78, discount: 10 }
];

const categories = ['Home', 'Electronic', 'Fashion', 'Beauty', 'Health', 'Sports', 'Fitness', 'Appliance', 'Jewelry', 'Furniture', 'Gaming'];

// Animated Hand Wave Component
const AnimatedHandWave = () => {
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startWaveAnimation = () => {
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: -1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Repeat animation after 3 seconds
        setTimeout(startWaveAnimation, 3000);
      });
    };

    // Start initial animation after 1 second
    setTimeout(startWaveAnimation, 1000);
  }, []);

  const rotateInterpolate = waveAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  return (
    <Animated.Text
      style={{
        transform: [{ rotate: rotateInterpolate }],
        fontSize: 28,
        marginLeft: 5,
      }}
    >
      👋
    </Animated.Text>
  );
};

// Animated Discount Badge Component
const AnimatedDiscountBadge = ({ discount, styles }) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulseAnimation();
  }, []);

  return (
    <Animated.View
      style={[
        styles.discountBadge,
        {
          transform: [{ scale: pulseAnimation }],
        },
      ]}
    >
      <Text style={styles.discountText}>-{discount}%</Text>
    </Animated.View>
  );
};

// Animated Chat Support FAB Component
const AnimatedChatFAB = ({ style, children, ...props }) => {
  const bounceAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startBounceAnimation = () => {
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnimation, {
          toValue: 1.1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnimation, {
          toValue: 1,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Repeat animation every 5 seconds
        setTimeout(startBounceAnimation, 5000);
      });
    };

    // Start bounce animation after 2 seconds
    setTimeout(startBounceAnimation, 2000);
  }, []);

  return (
    <TouchableOpacity {...props}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: bounceAnimation }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const OnboardingModal = ({ visible, step, onNext, onSkip }) => {
  const { theme } = useTheme();
  
  const steps = [
    {
      title: "View Profile",
      description: "Your uploaded image and profile details will appear here",
      element: "profile",
      position: { top: 135, right: 2 },
      arrowDirection: "topRight"
    },
    {
      title: "Chat With Support", 
      description: "Get help through FairTrade's secure support chat",
      element: "escrobond",
      position: { bottom: 172, right: 2 },
      arrowDirection: "bottomRight"
    },
    {
      title: "Home Button",
      description: "Quickly return to your main hub with the Home button",
      element: "chat",
      position: { bottom: 80, left: 2 },
      arrowDirection: "bottomLeft"
    }
  ];

  const currentStep = steps[step];

  const getArrowStyle = (direction) => {
    const baseArrow = {
      position: 'absolute',
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
    };

    switch (direction) {
      case 'topRight':
        return {
          ...baseArrow,
          top: -10,
          right: 30,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: theme.card,
        };
      case 'bottomRight':
        return {
          ...baseArrow,
          bottom: -10,
          right: 30,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: theme.card,
        };
      case 'bottomLeft':
        return {
          ...baseArrow,
          bottom: -10,
          left: 30,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: theme.card,
        };
      default:
        return baseArrow;
    }
  };

  if (!visible || !currentStep) return null;

  const dynamicStyles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dynamicStyles.onboardingOverlay}>
        {/* Positioned Tooltip */}
        <View style={[dynamicStyles.tooltipContainer, currentStep.position]}>
          <View style={getArrowStyle(currentStep.arrowDirection)} />
          <Text style={dynamicStyles.tooltipTitle}>{currentStep.title}</Text>
          <Text style={dynamicStyles.tooltipDescription}>{currentStep.description}</Text>
          <View style={dynamicStyles.tooltipButtons}>
            <TouchableOpacity onPress={onSkip} style={dynamicStyles.skipButton}>
              <Text style={dynamicStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={dynamicStyles.nextButton}>
              <Text style={dynamicStyles.nextButtonText}>
                {step === 2 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.stepIndicator}>
            {steps.map((_, index) => (
              <View 
                key={index} 
                style={[
                  dynamicStyles.stepDot, 
                  index === step && dynamicStyles.activeStepDot
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  
  // NEW: State for user-generated products
  const [userProducts, setUserProducts] = useState([]);
  const [allProducts, setAllProducts] = useState(hardcodedProducts);
  
  const categoryScrollRef = useRef(null);

  // Create dynamic styles using theme
  const styles = createStyles(theme);

  // NEW: Load user-generated products from AsyncStorage
  const loadUserProducts = async () => {
    try {
      const savedProductsJson = await AsyncStorage.getItem('userProducts');
      if (savedProductsJson) {
        const savedProducts = JSON.parse(savedProductsJson);
        setUserProducts(savedProducts);
        
        // Combine user products (first) with hardcoded products (second)
        const combinedProducts = [...savedProducts, ...hardcodedProducts];
        setAllProducts(combinedProducts);
      } else {
        // No user products, use only hardcoded
        setAllProducts(hardcodedProducts);
        setUserProducts([]);
      }
    } catch (error) {
      console.error('Error loading user products:', error);
      // Fallback to hardcoded products
      setAllProducts(hardcodedProducts);
      setUserProducts([]);
    }
  };

  // Load profile image from AsyncStorage
  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // Load profile image when component mounts
  useEffect(() => {
    loadProfileImage();
    loadUserProducts(); // Load user products on mount
  }, []);

  // Load profile image and user products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfileImage();
      loadUserProducts(); // Reload products when returning to screen
    }, [])
  );

  // Mark user-generated products for identification
  useEffect(() => {
    // Add isUserGenerated flag to user products for easy identification
    const markedUserProducts = userProducts.map(product => ({
      ...product,
      isUserGenerated: true
    }));
    
    // Combine marked user products with hardcoded products
    const combinedProducts = [...markedUserProducts, ...hardcodedProducts];
    setAllProducts(combinedProducts);
  }, [userProducts]);

  useEffect(() => {
    // Filter products based on search and category
    let filtered = allProducts; // Now uses combined products (user + hardcoded)
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // When Home is selected, show all products from all categories
    // When other categories are selected, filter by that specific category
    if (selectedCategory !== 'Home') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    // If selectedCategory is 'Home', we show all products (no filtering)
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, allProducts]); // Added allProducts as dependency

  const handleNextOnboarding = () => {
    if (onboardingStep < 2) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const isElementHighlighted = (elementType) => {
    if (!showOnboarding) return false;
    
    switch (onboardingStep) {
      case 0: return elementType === 'profile';
      case 1: return elementType === 'escrobond' || elementType === 'fab';
      case 2: return elementType === 'chat';
      default: return false;
    }
  };

  // UPDATED: Enhanced ProductCard component with proper navigation
const ProductCard = ({ product }) => {
  const handleProductPress = () => {
    // Navigate to product details screen with product data
    router.push(`/products/product-details?product=${encodeURIComponent(JSON.stringify(product))}`);
  };

    return (
      <TouchableOpacity style={styles.productCard} onPress={handleProductPress}>
        <View style={styles.productImageContainer}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={theme.textTertiary} />
            </View>
          )}
          {product.discount > 0 && (
            <AnimatedDiscountBadge discount={product.discount} styles={styles} />
          )}
          {/* NEW: Badge for user-generated products */}
          {product.isUserGenerated && (
            <View style={styles.newProductBadge}>
              <Text style={styles.newProductText}>NEW</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(product.id)}
          >
            <Ionicons 
              name={favorites.has(product.id) ? "heart" : "heart-outline"} 
              size={16} 
              color={favorites.has(product.id) ? "#FF4444" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.reviews}>({product.reviews})</Text>
          </View>
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              {product.discount > 0 && (
                <Text style={styles.originalPrice}>
                  ${Math.round(product.price * (1 + product.discount / 100))}
                </Text>
              )}
              <Text style={styles.productPrice}>${product.price}</Text>
            </View>
            <TouchableOpacity style={styles.addToCartButton}>
              <Ionicons name="add" size={16} color={brandColor} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CategoryChip = ({ category, isSelected, onPress }) => (
    <TouchableOpacity 
      style={[styles.categoryChip, isSelected && styles.selectedCategoryChip]}
      onPress={onPress}
    >
      <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style={theme.statusBar} />
      
      {/* Blur overlay for non-highlighted elements */}
      {showOnboarding && (
        <View style={styles.blurOverlay} pointerEvents="none" />
      )}
      
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <View style={[
          styles.header,
          showOnboarding && !isElementHighlighted('profile') && styles.blurredElement
        ]}>
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
              <Text style={styles.logoText}>FairTrade</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.profileContainer,
                  isElementHighlighted('profile') && styles.highlightedElement
                ]}
                onPress={() => router.push('/profile')}
              >
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profilePic} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting with Animated Hand Wave */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hi, Welcome</Text>
            <AnimatedHandWave />
          </View>
          <Text style={styles.subGreeting}>Find your favorite deals</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={theme.textTertiary} style={styles.searchIconLeft} />
              <TextInput
                placeholder="Search products or services"
                placeholderTextColor={theme.textTertiary}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color={brandColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={[
          styles.section,
          showOnboarding && styles.blurredElement
        ]}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryScrollContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              ref={categoryScrollRef}
              scrollEventThrottle={16}
            >
              {categories.map((category, index) => (
                <CategoryChip
                  key={`${category}-${index}`}
                  category={category}
                  isSelected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Featured Banner */}
        {selectedCategory === 'Home' && (
          <View style={[
            styles.section,
            showOnboarding && styles.blurredElement
          ]}>
            <View style={styles.featuredBanner}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Special Offers</Text>
                <Text style={styles.bannerSubtitle}>Up to 50% off on selected items</Text>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bannerImagePlaceholder}>
                <Ionicons name="gift-outline" size={40} color={brandColor} />
              </View>
            </View>
          </View>
        )}

        {/* Products Grid */}
        <View style={[
          styles.section,
          showOnboarding && styles.blurredElement
        ]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'Home' ? 'Popular Items' : selectedCategory}
              {/* NEW: Show count of user products if any */}
              {userProducts.length > 0 && selectedCategory === 'Home' && (
                <Text style={styles.newProductsCount}> ({userProducts.length} new)</Text>
              )}
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => <ProductCard product={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search</Text>
              </View>
            }
          />
        </View>

        {/* Bottom Padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button for Chat Support */}
      <AnimatedChatFAB 
        style={[
          styles.fab,
          isElementHighlighted('fab') && styles.highlightedElement
        ]}
      >
        <Ionicons name="headset-outline" size={24} color="#fff" />
      </AnimatedChatFAB>

      {/* Onboarding Modal */}
      <OnboardingModal
        visible={showOnboarding}
        step={onboardingStep}
        onNext={handleNextOnboarding}
        onSkip={handleSkipOnboarding}
      />
    </View>
  );
}

// Dynamic styles function that uses theme
const createStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  blurredElement: {
    opacity: 0.3,
  },
  highlightedElement: {
    zIndex: 10,
    elevation: 20,
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: theme.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: '#FF4444',
    borderRadius: 4,
  },
  profileContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  subGreeting: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIconLeft: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  filterButton: {
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
  },
  // NEW: Style for new products count
  newProductsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColor,
  },
  seeAllText: {
    color: brandColor,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryScrollContainer: {
    overflow: 'visible',
  },
  categoryContainer: {
    overflow: 'hidden',
  },
  categoryList: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: theme.surface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedCategoryChip: {
    backgroundColor: brandColor,
    borderColor: brandColor,
  },
  categoryText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  featuredBanner: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: brandColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  bannerImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: theme.card,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 52) / 2,
    backgroundColor: theme.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.shadow.split('(')[0],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.shadow.includes('0.1') ? 0.1 : 0.3,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // NEW: Badge for user-generated products
  newProductBadge: {
    position: 'absolute',
    top: 8,
    right: 40,
    backgroundColor: brandColor,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  newProductText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
    marginRight: 2,
    fontWeight: '500',
  },
  reviews: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: theme.textTertiary,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: 16,
    color: brandColor,
    fontWeight: '700',
  },
  addToCartButton: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textTertiary,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: brandColor,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Enhanced Onboarding Styles
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: 280,
    shadowColor: theme.shadow.split('(')[0],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  tooltipDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  tooltipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  skipButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    backgroundColor: brandColor,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  activeStepDot: {
    backgroundColor: brandColor,
    width: 12,
  },
});