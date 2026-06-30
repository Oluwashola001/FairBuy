// app/auth/verify.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { theme, isDark } = useTheme();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 8) {
      Alert.alert('Invalid Code', 'Please enter the 8-digit code.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: String(email),
        token: code,
        type: 'signup',
      });

      if (error) throw error;
      
      if (data.session?.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.session.user.id)
          .single();

        if (profile?.username) {
          // SUCCESS: Profile exists, go home!
          router.replace('/(tabs)/home'); 
        } else {
          // NO PROFILE: Force them to onboarding!
          router.replace('/auth/onboarding');
        }
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email: String(email) });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Sent', 'A new code has been sent to your email.');
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <View style={styles.heroBackground} />

      <View style={styles.headerSpacer}>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.backButton}>
           <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.brandingContainer}>
        <View style={styles.iconWrapper}>
           <Ionicons name="mail-open-outline" size={40} color={brandColor} />
        </View>
        <Text style={styles.brandName}>Check your email</Text>
      </View>

      <View style={styles.authCard}>
        <Text style={styles.cardSubtitle}>We've sent an 8-digit code to</Text>
        <Text style={styles.highlightEmail}>{email}</Text>

        <TextInput
          style={styles.codeInput}
          placeholder="00000000"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={8}
          placeholderTextColor={theme.textTertiary}
          autoFocus
        />

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleVerifyCode}
          disabled={loading || code.length !== 8}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Verify Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
          <Text style={styles.resendText}>Didn't get the code? <Text style={{fontWeight: '700'}}>Resend</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, alignItems: 'center', paddingHorizontal: 20 },
  heroBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: brandColor, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerSpacer: { height: Platform.OS === 'ios' ? 70 : 90, width: '100%', alignItems: 'flex-start', justifyContent: 'flex-end' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  brandingContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  iconWrapper: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  authCard: { width: '100%', backgroundColor: theme.card, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: theme.shadow?.split('(')[0] || '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: theme.border },
  cardSubtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center' },
  highlightEmail: { fontSize: 16, color: brandColor, fontWeight: '700', marginBottom: 32, textAlign: 'center' },
  codeInput: { width: '100%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 20, marginBottom: 24, fontSize: 24, fontWeight: '700', color: theme.text, textAlign: 'center', letterSpacing: 8 },
  primaryButton: { width: '100%', flexDirection: 'row', backgroundColor: brandColor, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 20 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resendButton: { padding: 10 },
  resendText: { color: theme.textSecondary, fontSize: 15 },
});