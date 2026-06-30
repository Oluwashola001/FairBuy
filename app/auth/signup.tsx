// app/auth/signup.tsx
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import CheckBox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      router.replace('/auth/onboarding');
    }
  };

  // Bounce logged-in users out to home or onboarding
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) checkProfileAndRoute(session.user.id);
    });
  }, []);

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName } // Save their name to DB!
        }
      });

      if (error) throw error;
      
      // Send straight to OTP verification
      router.push({ pathname: '/auth/verify', params: { email } });
      
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const redirectUrl = makeRedirectUri();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true }
      });
      
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const urlParams = new URLSearchParams(result.url.split('#')[1]);
          if (urlParams.get('access_token') && urlParams.get('refresh_token')) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: urlParams.get('access_token')!,
              refresh_token: urlParams.get('refresh_token')!,
            });
            
            if (sessionError) throw sessionError;
            
            if (sessionData.session?.user) {
              await checkProfileAndRoute(sessionData.session.user.id);
            }
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Google Auth Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <View style={styles.heroBackground} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.headerSpacer} />
        
        <View style={styles.brandingContainer}>
          <Text style={styles.brandName}>Create Account</Text>
          <Text style={styles.brandTagline}>Join FairTrade today.</Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
            <TextInput
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholderTextColor={theme.textTertiary}
            />
          </View>

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

          <View style={styles.termsContainer}>
            <CheckBox
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              color={termsAccepted ? brandColor : theme.border}
              style={styles.checkbox}
            />
            <Text style={styles.termsText}>I agree to the Terms & Privacy Policy.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, !termsAccepted && { opacity: 0.6 }]} 
            onPress={handleSignup} 
            disabled={!termsAccepted || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup} activeOpacity={0.8} disabled={loading}>
            <Image source={require('@/assets/images/google-logo.png')} style={{ width: 24, height: 24, marginRight: 10 }} resizeMode="contain" />
            <Text style={styles.googleButtonText}>Sign Up with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  heroBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, backgroundColor: brandColor, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 },
  headerSpacer: { height: Platform.OS === 'ios' ? 60 : 70, width: '100%' },
  brandingContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  brandName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandTagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  authCard: { width: '100%', backgroundColor: theme.card, borderRadius: 24, padding: 24, shadowColor: theme.shadow?.split('(')[0] || '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: theme.border, marginBottom: 40 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: theme.text },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingRight: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, marginRight: 10 },
  termsText: { color: theme.textSecondary, fontSize: 14, flex: 1 },
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