// app/auth/login.tsx
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';
const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // NEW: Helper function to check if profile exists before routing
  const checkProfileAndRoute = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (data?.username) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth/onboarding');
      }
    } catch (err) {
      // If no row is found, Supabase throws an error. Catch it and send to onboarding.
      router.replace('/auth/onboarding');
    }
  };

  // CRITICAL FIX: Automatically redirect to Home or Onboarding if already logged in!
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await checkProfileAndRoute(session.user.id);
      } else {
        setCheckingSession(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      if (data.session?.user) {
        await checkProfileAndRoute(data.session.user.id);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = makeRedirectUri();
      
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, 
        }
      });
      
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          const urlParams = new URLSearchParams(result.url.split('#')[1]);
          const access_token = urlParams.get('access_token');
          const refresh_token = urlParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (sessionError) throw sessionError;
            
            if (sessionData.session?.user) {
              await checkProfileAndRoute(sessionData.session.user.id);
            }
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Google Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  // Don't flash the login screen if we are about to redirect them
  if (checkingSession) return <View style={styles.container} />;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Absolute Hero Banner Background */}
      <View style={styles.heroBackground} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerSpacer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* App Branding (Logo completely removed) */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandName}>FairTrade</Text>
          <Text style={styles.brandTagline}>Your Premium Marketplace</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue shopping</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/auth/reset-password')} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleLogin} 
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Logging in...' : 'Sign In'}</Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Image source={require('@/assets/images/google-logo.png')} style={{ width: 24, height: 24, marginRight: 10 }} resizeMode="contain" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
  }


const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  heroBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: brandColor, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 },
  
  // Back arrow stays perfectly anchored here
  headerSpacer: { height: Platform.OS === 'ios' ? 70 : 90, width: '100%', alignItems: 'flex-start', justifyContent: 'flex-end' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  // Shifted up tighter using a negative top margin
  brandingContainer: { alignItems: 'center', marginBottom: 30, marginTop: -15 },
  
  brandName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandTagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  authCard: { width: '100%', backgroundColor: theme.card, borderRadius: 24, padding: 24, shadowColor: theme.shadow?.split('(')[0] || '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: theme.border, marginBottom: 40 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 8 },
  cardSubtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 24 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: theme.text },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: brandColor, fontWeight: '600', fontSize: 14 },
  primaryButton: { flexDirection: 'row', backgroundColor: brandColor, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16, marginRight: 8 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { color: theme.textTertiary, paddingHorizontal: 16, fontSize: 14, fontWeight: '600' },
  googleButton: { flexDirection: 'row', backgroundColor: theme.surface, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  googleButtonText: { color: theme.text, fontWeight: '600', fontSize: 16 },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: theme.textSecondary, fontSize: 15 },
  footerLink: { color: brandColor, fontWeight: '700', fontSize: 15 },
});