import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';
const inputWidth = 320;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  
  // Animation ref for the breathing effect
  const breathingAnimation = useRef(new Animated.Value(1)).current;

  // Start the breathing animation when component mounts
  useEffect(() => {
    const breathe = () => {
      Animated.sequence([
        Animated.timing(breathingAnimation, {
          toValue: 1.8, // Scale up to 105%
          duration: 2000, // 2 seconds to expand
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnimation, {
          toValue: 1, // Scale back to normal
          duration: 2000, // 2 seconds to contract
          useNativeDriver: true,
        }),
      ]).start(() => {
        breathe(); // Loop the animation continuously
      });
    };

    breathe(); // Start the first breath
  }, [breathingAnimation]);

  // Create the breathing transform
  const breathingTransform = {
    transform: [
      {
        scale: breathingAnimation,
      },
    ],
  };

  const handleLogin = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else if (data.user && data.session) {
      router.replace('/(tabs)/home'); // ✅ Ensures login was successful before navigating
    } else {
      Alert.alert('Login Failed', 'Unexpected login response. Please try again.');
    }
  } catch (err) {
    setLoading(false);
    Alert.alert('Error', 'Something went wrong. Please try again later.');
  }
};

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) Alert.alert('Google Login Failed', error.message);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={theme.statusBar} />
      
      {/* Logo + Brand Name with Breathing Animation */}
      <View style={styles.logoContainer}>
        <Animated.View style={breathingTransform}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.logoText}>FairTrade</Text>
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Please enter your email and password.</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          placeholderTextColor={theme.textTertiary}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor={theme.textTertiary}
        />
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/signup')} style={styles.signupContainer}>
        <Text style={styles.signupText}>Create an account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <View style={styles.googleContent}>
          <Image source={require('@/assets/images/google-logo.png')} style={styles.googleLogo} resizeMode="contain" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </View>
      </TouchableOpacity>
      
      {/* Bottom spacing for clean look */}
      <View style={styles.bottomSpace} />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    color: theme.text,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    width: inputWidth,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    color: theme.text,
  },
  loginButton: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    borderRadius: 12,
    width: inputWidth,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  signupContainer: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  signupText: {
    color: theme.textSecondary,
    textDecorationLine: 'underline',
    fontSize: 16,
    fontWeight: '500',
  },
  googleButton: {
    borderColor: theme.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    width: inputWidth,
    alignItems: 'center',
    backgroundColor: theme.card,
    ...theme.shadow,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleText: {
    fontWeight: '600',
    color: theme.text,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  bottomSpace: {
    height: 60,
  },
});