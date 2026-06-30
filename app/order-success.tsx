// app/order-success.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "./contexts/ThemeContext";

const { width, height } = Dimensions.get('window');

// --- Dynamic Celebration Component ---
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

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Celebration Elements */}
      <View style={styles.celebrationLayer} pointerEvents="none">
        {confetti.map((item) => <CelebrationItem key={item.id} type="confetti" startX={item.startX} delay={item.delay} />)}
        {sparkles.map((item) => <CelebrationItem key={item.id} type="sparkle" startX={item.startX} delay={item.delay} />)}
        {balloons.map((item) => <CelebrationItem key={item.id} type="balloon" startX={item.startX} delay={item.delay} />)}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleValue }], opacity: fadeValue }]}>
          {/* Glowing Checkmark */}
          <View style={styles.iconWrapper}>
            <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
              <Ionicons name="checkmark-circle" size={100} color="#10b981" />
            </Animated.View>
          </View>
          
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>
            Your order has been placed and is being processed by the seller.
          </Text>

          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Order Status:</Text>
              <Text style={styles.receiptValue}>Confirmed</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomContainer, { opacity: fadeValue }]}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.push("/(tabs)/home")}
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.secondaryBtnText}>View My Orders</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.background ?? "#fff",
  },
  celebrationLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme?.text ?? "#1a1d21",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme?.textSecondary ?? "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  receiptCard: {
    backgroundColor: theme?.surface ?? "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: theme?.border ?? "#e1e5e9",
    shadowColor: theme?.shadow?.split('(')[0] || '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 15,
    color: theme?.textSecondary ?? "#6b7280",
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10b981",
  },
  bottomContainer: {
    padding: 24,
    paddingBottom: 40,
    zIndex: 10,
  },
  primaryBtn: {
    backgroundColor: theme?.brandColor ?? "#4B56E9",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: theme?.brandColor ?? "#4B56E9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme?.border ?? "#e1e5e9",
  },
  secondaryBtnText: {
    color: theme?.text ?? "#1a1d21",
    fontSize: 16,
    fontWeight: "700",
  },
});