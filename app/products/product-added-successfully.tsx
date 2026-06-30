// app/products/product-added-successfully.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

// --- Dynamic Celebration Component ---
// Renders actual emojis (Balloons float UP, Confetti falls DOWN)
const CelebrationItem = ({ type, startX, delay }: { type: 'balloon' | 'confetti' | 'sparkle', startX: number, delay: number }) => {
  const isBalloon = type === 'balloon';
  const translateY = useRef(new Animated.Value(isBalloon ? height + 50 : -100)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(isBalloon ? Math.random() * 0.5 + 0.8 : Math.random() * 0.5 + 0.5)).current;

  useEffect(() => {
    // 1. Vertical Movement
    Animated.loop(
      Animated.timing(translateY, {
        toValue: isBalloon ? -200 : height + 100,
        duration: isBalloon ? 5000 + Math.random() * 4000 : 3000 + Math.random() * 3000,
        delay: delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 2. Horizontal Swaying (Wind effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: startX + (Math.random() * 60 + 30),
          duration: 2000 + Math.random() * 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX - (Math.random() * 60 + 30),
          duration: 2000 + Math.random() * 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX,
          duration: 2000 + Math.random() * 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Rotation (Tumbling effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: isBalloon ? ['-15deg', '15deg'] : ['-180deg', '180deg'],
  });

  // Pick the right emoji
  let emoji = '🎈';
  if (type === 'confetti') emoji = Math.random() > 0.5 ? '🎉' : '🎊';
  if (type === 'sparkle') emoji = '✨';

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: isBalloon ? 50 : 24,
        transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }],
        opacity: isBalloon ? 0.9 : 0.8,
        zIndex: isBalloon ? 1 : 0,
      }}
    >
      {emoji}
    </Animated.Text>
  );
};

export default function ProductSuccessScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const productData = params.productData ? JSON.parse(params.productData as string) : null;

  // Main UI Animations
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Generate random positions for our celebration items
  const balloons = Array.from({ length: 12 }).map((_, i) => ({ id: `b_${i}`, startX: Math.random() * width, delay: Math.random() * 4000 }));
  const confetti = Array.from({ length: 20 }).map((_, i) => ({ id: `c_${i}`, startX: Math.random() * width, delay: Math.random() * 3000 }));
  const sparkles = Array.from({ length: 10 }).map((_, i) => ({ id: `s_${i}`, startX: Math.random() * width, delay: Math.random() * 2000 }));

  useEffect(() => {
    // 1. Entrance Animation
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Checkmark Pop
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(checkmarkScale, {
        toValue: 1.2,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 80,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 3. Continuous Pulsing Glow around Checkmark
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    });
  }, []);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Background Celebration Elements */}
      <View style={styles.celebrationLayer} pointerEvents="none">
        {confetti.map((item) => <CelebrationItem key={item.id} type="confetti" startX={item.startX} delay={item.delay} />)}
        {sparkles.map((item) => <CelebrationItem key={item.id} type="sparkle" startX={item.startX} delay={item.delay} />)}
        {balloons.map((item) => <CelebrationItem key={item.id} type="balloon" startX={item.startX} delay={item.delay} />)}
      </View>

      {/* Close Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.push('/(seller)/dashboard')} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Success Content */}
      <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleValue }], opacity: fadeValue }]}>
        
        {/* Glowing Checkmark */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
            <Ionicons name="checkmark-circle" size={100} color="#10B981" />
          </Animated.View>
        </View>
        
        <Text style={styles.successTitle}>Product Live! 🎉</Text>
        <Text style={styles.successSubtitle}>
          Your product has successfully launched and is now live for buyers.
        </Text>
      </Animated.View>

      {/* Product Preview Card */}
      {productData && (
        <Animated.View style={[styles.productPreview, { opacity: fadeValue }]}>
          <View style={styles.previewCard}>
            {productData.image ? (
              <Image source={{ uri: productData.image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={40} color={theme.textTertiary} />
              </View>
            )}
            
            <View style={styles.previewDetails}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.previewName} numberOfLines={2}>{productData.name}</Text>
              <Text style={styles.previewPrice}>${productData.price}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <Animated.View style={[styles.actionContainer, { opacity: fadeValue }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(seller)/dashboard')} activeOpacity={0.9}>
          <Ionicons name="grid-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>View Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={22} color="#4B56E9" />
          <Text style={styles.secondaryButtonText}>Add Another Product</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  celebrationLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 32,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    zIndex: 2,
    paddingHorizontal: 20,
  },
  iconWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  successTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    fontWeight: '500',
  },
  productPreview: {
    paddingHorizontal: 24,
    marginBottom: 40,
    zIndex: 5,
  },
  previewCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow?.split('(')[0] || '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: theme.surface,
  },
  placeholderImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  liveText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  previewPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4B56E9',
  },
  actionContainer: {
    paddingHorizontal: 24,
    marginTop: 'auto',
    marginBottom: 40,
    zIndex: 10,
  },
  primaryButton: {
    backgroundColor: '#4B56E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#4B56E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: theme.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(75, 86, 233, 0.2)',
  },
  secondaryButtonText: {
    color: '#4B56E9',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },
});