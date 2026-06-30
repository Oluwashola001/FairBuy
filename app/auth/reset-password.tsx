// app/auth/reset-password.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequestCode = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email.');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) Alert.alert('Error', error.message);
    else setStep(2);
  };

  const handleResetPassword = async () => {
    if (!code || code.length !== 8) return Alert.alert('Error', 'Invalid Code.');
    if (!newPassword || newPassword.length < 6) return Alert.alert('Error', 'Password must be 6+ chars.');

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (verifyError) {
      setLoading(false);
      return Alert.alert('Error', verifyError.message);
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) Alert.alert('Error', updateError.message);
    else {
      Alert.alert('Success', 'Password reset! Please log in.');
      await supabase.auth.signOut();
      router.replace('/auth/login'); 
    }
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <View style={styles.heroBackground} />

      <View style={styles.headerSpacer}>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.brandingContainer}>
        <View style={styles.iconWrapper}>
           <Ionicons name={step === 1 ? "key-outline" : "lock-open-outline"} size={40} color={brandColor} />
        </View>
        <Text style={styles.brandName}>{step === 1 ? 'Reset Password' : 'New Password'}</Text>
      </View>

      <View style={styles.authCard}>
        {step === 1 ? (
          <>
            <Text style={styles.cardSubtitle}>Enter your email to receive an 8-digit reset code.</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={theme.textTertiary} />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRequestCode} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send Code'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.cardSubtitle}>Enter the code sent to <Text style={{color: brandColor}}>{email}</Text></Text>
            <TextInput style={styles.codeInput} placeholder="8-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} placeholderTextColor={theme.textTertiary} />
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textTertiary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholderTextColor={theme.textTertiary} />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, alignItems: 'center', paddingHorizontal: 20 },
  heroBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: brandColor, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
   // Back arrow stays perfectly anchored here
  headerSpacer: { height: Platform.OS === 'ios' ? 70 : 90, width: '100%', alignItems: 'flex-start', justifyContent: 'flex-end' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  brandingContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  iconWrapper: { width: 80, height: 80, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  brandName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  authCard: { width: '100%', backgroundColor: theme.card, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: theme.shadow?.split('(')[0] || '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: theme.border },
  cardSubtitle: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, height: 56 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: theme.text },
  codeInput: { width: '100%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, marginBottom: 16, fontSize: 22, fontWeight: '700', color: theme.text, textAlign: 'center', letterSpacing: 8 },
  primaryButton: { width: '100%', flexDirection: 'row', backgroundColor: brandColor, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});