// app/(tabs)/home.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { useCart } from "../contexts/CartContext";
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const brandColor = '#4B56E9';

const categories = ['Home', 'Electronic', 'Fashion', 'Beauty', 'Health', 'Sports', 'Fitness', 'Appliance', 'Jewelry', 'Furniture', 'Gaming'];

// Memory leak cleanup added to animations to prevent hanging on navigation
const AnimatedHandWave = () => {
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const startWaveAnimation = () => {
      Animated.sequence([
        Animated.timing(waveAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(waveAnimation, { toValue: -1, duration: 300, useNativeDriver: true }),
        Animated.timing(waveAnimation, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(waveAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        timeoutId = setTimeout(startWaveAnimation, 3000);
      });
    };

    timeoutId = setTimeout(startWaveAnimation, 1000);
    
    return () => clearTimeout(timeoutId); // Cleanup
  }, [waveAnimation]);

  const rotateInterpolate = waveAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  return (
    <Animated.Text style={{ transform: [{ rotate: rotateInterpolate }], fontSize: 24, marginLeft: 5 }}>
      👋
    </Animated.Text>
  );
};

const AnimatedDiscountBadge = ({ discount, styles }: any) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop(); 
  }, [pulseAnimation]);

  return (
    <Animated.View style={[styles.discountBadge, { transform: [{ scale: pulseAnimation }] }]}>
      <Text style={styles.discountText}>-{discount}%</Text>
    </Animated.View>
  );
};

// Create an Animated version of TouchableOpacity
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedChatFAB = ({ style, children, ...props }: any) => {
  const bounceAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const startBounceAnimation = () => {
      Animated.sequence([
        Animated.timing(bounceAnimation, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.spring(bounceAnimation, { toValue: 1.1, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.spring(bounceAnimation, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
      ]).start(() => {
        timeoutId = setTimeout(startBounceAnimation, 5000);
      });
    };

    timeoutId = setTimeout(startBounceAnimation, 2000);
    return () => clearTimeout(timeoutId); 
  }, [bounceAnimation]);

  return (
    <AnimatedTouchableOpacity 
      style={[style, { transform: [{ scale: bounceAnimation }] }]} 
      {...props} 
      activeOpacity={0.9}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
};

const OnboardingModal = ({ visible, step, onNext, onSkip }: any) => {
  const { theme } = useTheme();
  
  const steps = [
    {
      title: "View Profile",
      description: "Your uploaded image and profile details will appear here",
      position: { top: 60, right: 20 },
      arrowDirection: "topRight"
    },
    {
      title: "Chat With Support", 
      description: "Get help through FairTrade's secure support chat",
      position: { bottom: 100, right: 20 },
      arrowDirection: "bottomRight"
    },
    {
      title: "Home Button",
      description: "Quickly return to your main hub with the Home button",
      position: { bottom: 100, left: 20 },
      arrowDirection: "bottomLeft"
    }
  ];

  const currentStep = steps[step];

  const getArrowStyle = (direction: string) => {
    const baseArrow = { position: 'absolute' as const, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid' as const };
    switch (direction) {
      case 'topRight': return { ...baseArrow, top: -10, right: 30, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderBottomColor: theme.card };
      case 'bottomRight': return { ...baseArrow, bottom: -10, right: 30, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 10, borderTopColor: theme.card };
      case 'bottomLeft': return { ...baseArrow, bottom: -10, left: 30, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 10, borderTopColor: theme.card };
      default: return baseArrow;
    }
  };

  if (!visible || !currentStep) return null;

  const dynamicStyles = createStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dynamicStyles.onboardingOverlay}>
        <View style={[dynamicStyles.tooltipContainer, currentStep.position as any]}>
          <View style={getArrowStyle(currentStep.arrowDirection)} />
          <Text style={dynamicStyles.tooltipTitle}>{currentStep.title}</Text>
          <Text style={dynamicStyles.tooltipDescription}>{currentStep.description}</Text>
          <View style={dynamicStyles.tooltipButtons}>
            <TouchableOpacity onPress={onSkip} style={dynamicStyles.skipButton}>
              <Text style={dynamicStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNext} style={dynamicStyles.nextButton}>
              <Text style={dynamicStyles.nextButtonText}>{step === 2 ? 'Get Started' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.stepIndicator}>
            {steps.map((_, index) => (
              <View key={index} style={[dynamicStyles.stepDot, index === step && dynamicStyles.activeStepDot]} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function HomeScreen() {
  const { addToCart } = useCart();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Home');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false); 
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  
  // --- Global Identity State ---
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
  const [userName, setUserName] = useState('Shopper');

  // --- Modal State for Error Handling ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  // Loading & Refreshing States
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const categoryScrollRef = useRef(null);
  const styles = createStyles(theme);

  const fetchStoreData = async () => {
    try {
      // 1. Strict Active Session Check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('Authentication required.');

      // 2. Fetch User Identity from Profiles Table (Profiles-First Architecture)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        if (profileData.avatar_url) setProfileImage(profileData.avatar_url);
        if (profileData.username) setUserName(profileData.username);
      }

      // 3. Fetch Real Products from Supabase (Newest First)
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (products && products.length > 0) {
        const mappedProducts = products.map(p => ({
          ...p,
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          image: p.image_url, 
          rating: (Math.random() * (5 - 4) + 4).toFixed(1), // Mock rating until reviews table is built
          reviews: Math.floor(Math.random() * 100) + 1,
          discount: 0
        }));

        setAllProducts(mappedProducts);
      } else {
        setAllProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setModalMessage(error.message || "Failed to load home data.");
      setIsModalVisible(true);
      setAllProducts([]);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      await fetchStoreData();
      setInitialLoading(false);
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoading) {
          fetchStoreData();
      }
    }, [initialLoading])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStoreData();
    setRefreshing(false);
  };

  // Filtering Logic
  useEffect(() => {
    let filtered = allProducts;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'Home') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, allProducts]);

  const toggleFavorite = (productId: any) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const ProductCard = ({ product }: any) => {
    const handleProductPress = () => {
      router.push(`/products/product-details?product=${encodeURIComponent(JSON.stringify(product))}`);
    };

    return (
      <TouchableOpacity style={styles.productCard} onPress={handleProductPress} activeOpacity={0.9}>
        <View style={styles.productImageContainer}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={theme.textTertiary} />
            </View>
          )}
          {product.discount > 0 && <AnimatedDiscountBadge discount={product.discount} styles={styles} />}
          
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(product.id)}
          >
            <Ionicons name={favorites.has(product.id) ? "heart" : "heart-outline"} size={16} color={favorites.has(product.id) ? "#FF4444" : "#fff"} />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.rating}>{product.rating}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => {
                addToCart(product);
                Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${product.name} added.`, position: 'top', visibilityTime: 2000 });
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CategoryChip = ({ category, isSelected, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.categoryChip, isSelected && styles.selectedCategoryChip]}
      onPress={onPress}
    >
      <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>{category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* --- Custom Error Modal --- */}
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Notice</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 16, marginBottom: 24, lineHeight: 22 }}>{modalMessage}</Text>
            <Pressable onPress={() => setIsModalVisible(false)} style={{ backgroundColor: brandColor, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Premium Integrated Header Background */}
      <View style={styles.heroBackground} />

      {/* Header Content */}
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.logoText}>FairTrade</Text>
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileContainer}>
              <Image source={{ uri: profileImage }} style={styles.profilePic} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Hey, {userName}</Text>
          <AnimatedHandWave />
        </View>
        <Text style={styles.subGreeting}>Let's find your favorite deals today</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIconLeft} />
          <TextInput
            placeholder="Search products or services..."
            placeholderTextColor={theme.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brandColor} colors={[brandColor]} />
        }
      >
        {/* Categories */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            ref={categoryScrollRef}
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

        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={styles.loadingText}>Curating your products...</Text>
          </View>
        ) : (
          <>
            {/* Featured Banner */}
            {selectedCategory === 'Home' && (
              <View style={styles.section}>
                <View style={styles.featuredBanner}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>Special Offers</Text>
                    <Text style={styles.bannerSubtitle}>Up to 50% off on selected items</Text>
                    <TouchableOpacity style={styles.bannerButton}>
                      <Text style={styles.bannerButtonText}>Shop Now</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bannerImagePlaceholder}>
                    <Ionicons name="gift" size={40} color="#fff" />
                  </View>
                </View>
              </View>
            )}

            {/* Products Grid */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory === 'Home' ? 'Latest Products' : selectedCategory}
                </Text>
              </View>
              
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
                  <Text style={styles.emptyText}>No products found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search</Text>
                </View>
              ) : (
                // Performance Fix: Replaced Flatlist with Flexbox map mapping
                <View style={styles.productsGrid}>
                  {filteredProducts.map((item) => (
                    <View key={`prod_${item.id}`} style={styles.gridItemWrapper}>
                       <ProductCard product={item} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button for Chat Support */}
      <AnimatedChatFAB style={styles.fab} onPress={() => router.push('/help')}>
        <Ionicons name="headset-outline" size={24} color="#fff" />
      </AnimatedChatFAB>

      <OnboardingModal
        visible={showOnboarding}
        step={onboardingStep}
        onNext={() => {
          if (onboardingStep < 2) setOnboardingStep(onboardingStep + 1);
          else setShowOnboarding(false);
        }}
        onSkip={() => setShowOnboarding(false)}
      />
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
    height: Platform.OS === 'ios' ? 240 : 260,
    backgroundColor: brandColor,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 60,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: '#fff',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 10,
    height: 10,
    backgroundColor: '#FF4444',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: brandColor,
  },
  profileContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)'
  },
  profilePic: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchIconLeft: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500'
  },
  categorySection: {
    marginTop: 20,
    marginBottom: 24,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: theme.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuredBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(75, 86, 233, 0.2)',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: brandColor,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: brandColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bannerImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: brandColor,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
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
  },
  newProductsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColor,
  },
  seeAllText: {
    color: brandColor,
    fontSize: 14,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  productCard: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  productImageContainer: {
    position: 'relative',
    backgroundColor: theme.surface,
  },
  productImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  newProductBadge: {
    position: 'absolute',
    top: 10,
    right: 42,
    backgroundColor: brandColor,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newProductText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
    height: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rating: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    color: brandColor,
    fontWeight: '800',
  },
  addToCartButton: {
    backgroundColor: brandColor,
    borderRadius: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: theme.textTertiary,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: brandColor,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  onboardingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
  tooltipContainer: { position: 'absolute', backgroundColor: theme.card, borderRadius: 16, padding: 20, width: 280, borderWidth: 1, borderColor: theme.border },
  tooltipTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8, textAlign: 'center' },
  tooltipDescription: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  tooltipButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  skipButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center', backgroundColor: theme.surface },
  skipButtonText: { color: theme.textSecondary, fontWeight: '600', fontSize: 14 },
  nextButton: { flex: 1, backgroundColor: brandColor, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
  activeStepDot: { backgroundColor: brandColor, width: 12 },
});