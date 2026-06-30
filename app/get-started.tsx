// app/index.tsx (or app/welcome.tsx depending on your entry point name)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from './contexts/ThemeContext'; // Ensure this points to your renamed context folder

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const brandColor = '#4B56E9';

interface Slide {
  id: number;
  image: any;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: require('@/assets/images/welcome-illustration1.png'),
    title: 'Your Shield In Every Deal.',
    subtitle: 'Shop, Sell and Hire. All in one secure marketplace.',
  },
  {
    id: 2,
    image: require('@/assets/images/welcome-illustration2.png'),
    title: 'Secure Escrow Deals',
    subtitle: 'Pay confidently using EscroBond for off-app transactions.',
  },
  {
    id: 3,
    image: require('@/assets/images/welcome-illustration3.png'),
    title: 'Track Your Orders',
    subtitle: 'Get real-time order updates from purchase to delivery.',
  },
];

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, isDark } = useTheme();

  const resetAutoScroll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slides.length;
        scrollViewRef.current?.scrollTo({
          x: nextSlide * screenWidth,
          animated: true,
        });
        return nextSlide;
      });
    }, 5000);
  };

  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex);
      resetAutoScroll();
    }
  };

  const renderSlide = (slide: Slide) => (
    <View key={slide.id} style={styles.slide}>
      {/* Top Half: Illustration */}
      <View style={styles.illustrationWrapper}>
        <Image source={slide.image} style={styles.illustration} resizeMode="contain" />
      </View>

      {/* Bottom Half: Text Content */}
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentSlide ? styles.activeDot : [styles.inactiveDot, { backgroundColor: theme.border }],
          ]}
        />
      ))}
    </View>
  );

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Premium Split Background Design */}
      <View style={styles.blueBackground} />
      <View style={styles.whiteBottomCard} />
      
      {/* Header / Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>FairTrade</Text>
        </View>
      </View>

      {/* Slider */}
      <View style={styles.slidesWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
        >
          {slides.map(renderSlide)}
        </ScrollView>
      </View>

      {/* Static Bottom Elements (Pagination & Button) */}
      <View style={styles.bottomStaticContainer}>
        {renderPaginationDots()}
        <TouchableOpacity 
          style={styles.getStartedButton} 
          onPress={() => router.push('/auth/signup')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  // The blue hero top section
  blueBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.55,
    backgroundColor: brandColor,
  },
  // The elevated white card bottom section
  whiteBottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.50,
    backgroundColor: theme.card,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 70,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 30,
    height: 30,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  slidesWrapper: {
    flex: 1,
    zIndex: 5,
  },
  slide: {
    width: screenWidth,
    height: '100%',
  },
  illustrationWrapper: {
    height: screenHeight * 0.55 - 120, // Leaves room for header
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustration: {
    width: screenWidth * 0.85,
    height: '90%',
  },
  textWrapper: {
    height: screenHeight * 0.45,
    paddingTop: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: theme.text,
    marginBottom: 12,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: theme.textSecondary,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  bottomStaticContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    zIndex: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: brandColor,
    width: 24,
    borderRadius: 12,
  },
  inactiveDot: {
    // Background color applied dynamically
  },
  getStartedButton: {
    flexDirection: 'row',
    backgroundColor: brandColor,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginRight: 8,
  },
});