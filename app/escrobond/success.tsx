// app/escrobond/success.tsx
// Local IDE version - preview disabled
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const brandColor = '#4B56E9';

// Celebration Animations (Balloons float UP, Confetti falls DOWN)
const CelebrationItem = ({ type, startX, delay }: { type: 'balloon' | 'confetti' | 'sparkle', startX: number, delay: number }) => {
  const isBalloon = type === 'balloon';
  const translateY = useRef(new Animated.Value(isBalloon ? height + 50 : -100)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(isBalloon ? Math.random() * 0.5 + 0.8 : Math.random() * 0.5 + 0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: isBalloon ? -200 : height + 100,
        duration: isBalloon ? 5000 + Math.random() * 4000 : 3000 + Math.random() * 3000,
        delay: delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, { toValue: startX + (Math.random() * 60 + 30), duration: 2000 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: startX - (Math.random() * 60 + 30), duration: 2000 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: startX, duration: 2000 + Math.random() * 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = rotate.interpolate({ inputRange: [-1, 1], outputRange: isBalloon ? ['-15deg', '15deg'] : ['-180deg', '180deg'] });
  let emoji = '🎈';
  if (type === 'confetti') emoji = Math.random() > 0.5 ? '🎉' : '🎊';
  if (type === 'sparkle') emoji = '✨';

  return (
    <Animated.Text style={{ position: 'absolute', fontSize: isBalloon ? 50 : 24, transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }], opacity: isBalloon ? 0.9 : 0.8, zIndex: isBalloon ? 1 : 0 }}>
      {emoji}
    </Animated.Text>
  );
};

export default function EscroBondSuccessScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { amount, seller, txId } = useLocalSearchParams();

  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  const balloons = Array.from({ length: 8 }).map((_, i) => ({ id: `b_${i}`, startX: Math.random() * width, delay: Math.random() * 4000 }));
  const confetti = Array.from({ length: 20 }).map((_, i) => ({ id: `c_${i}`, startX: Math.random() * width, delay: Math.random() * 3000 }));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeValue, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.celebrationLayer} pointerEvents="none">
        {confetti.map((item) => <CelebrationItem key={item.id} type="confetti" startX={item.startX} delay={item.delay} />)}
        {balloons.map((item) => <CelebrationItem key={item.id} type="balloon" startX={item.startX} delay={item.delay} />)}
      </View>

      <Animated.View style={[styles.content, { transform: [{ scale: scaleValue }], opacity: fadeValue }]}>
        <Text style={styles.emojiHero}>🛡️</Text>
        <Text style={styles.title}>Verification Successful!</Text>
        
        {/* Updated messaging to reflect the 24-hour pending release architecture */}
        <Text style={styles.subtitle}>
          Your <Text style={{fontWeight: '800', color: theme.text}}>${Number(amount).toLocaleString()}</Text> is now in a secure 24-hour verification hold.
        </Text>

        <Text style={styles.helperText}>
          If no issues are reported during this window, the funds will be automatically released to <Text style={{fontWeight: '800', color: theme.text}}>@{seller}</Text>.
        </Text>
        
        <Text style={styles.txText}>Transaction ID: {txId}</Text>
      </Animated.View>

      <Animated.View style={[styles.bottomContainer, { opacity: fadeValue }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/escrobond')} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>View Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  celebrationLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, zIndex: 2 },
  emojiHero: { fontSize: 90, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: theme.text, marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 18, color: theme.textSecondary, textAlign: 'center', lineHeight: 28, marginBottom: 16 },
  helperText: { fontSize: 15, color: '#10B981', textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  txText: { fontSize: 14, color: theme.textTertiary, textDecorationLine: 'underline' },
  bottomContainer: { padding: 24, paddingBottom: 40, zIndex: 10 },
  primaryBtn: { backgroundColor: brandColor, paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});