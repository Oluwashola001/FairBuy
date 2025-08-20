import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from './contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

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
    subtitle: 'Shop, Sell and Hire. All in one place',
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
    subtitle: 'Real-time order updates from purchase to delivery.',
  },
];

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme } = useTheme();

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
    <View key={slide.id} style={[styles.slide, { width: screenWidth }]}>
      <Image source={slide.image} style={styles.illustration} resizeMode="contain" />
      <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{slide.subtitle}</Text>
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
      <StatusBar style={theme.statusBar} />
      <View style={styles.backgroundGradient} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.brandName}>FairTrade</Text>
        </View>
      </View>

      <View style={styles.slidesWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {slides.map(renderSlide)}
        </ScrollView>
      </View>

      {renderPaginationDots()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.getStartedButton} onPress={() => router.push('/auth/login')}>
          <Text style={styles.buttonText}>Get Started</Text>
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
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: theme.surface,
    opacity: 0.6,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 35,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#4B56E9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.6,
  },
  slidesWrapper: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  illustration: {
    width: screenWidth * 0.8,
    height: 280,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 48,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  activeDot: {
    backgroundColor: '#4B56E9',
    width: 24,
    borderRadius: 12,
    shadowColor: '#4B56E9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  inactiveDot: {
    // backgroundColor applied dynamically above
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  getStartedButton: {
    backgroundColor: '#4B56E9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4B56E9',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});