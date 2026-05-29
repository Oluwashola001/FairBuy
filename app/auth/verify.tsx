// app/auth/verify.tsx
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';
const inputWidth = 320;

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  
  const { theme, isDark } = useTheme();
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 8) {
      Alert.alert('Invalid Code', 'Please enter the 8-digit code sent to your email.');
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: String(email),
      token: code,
      type: 'signup',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Verification Failed', error.message);
    } else if (data.session) {
      // UX Update: Route to verified.tsx instead of home!
      router.replace('/auth/verified'); 
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert('Error', 'No email found to resend verification.');
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: String(email),
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'A new 8-digit code has been sent to your email.');
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Text style={styles.heading}>Verify Your Email</Text>
      <Text style={styles.subheading}>
        We sent an 8-digit code to <Text style={styles.highlightEmail}>{email}</Text>. Please enter it below to activate your account.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 8-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={8}
        placeholderTextColor={theme.textTertiary}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleVerifyCode}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendVerification} style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't get the code? Tap here to resend</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginFallback}>
        <Text style={styles.loginText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.background,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  highlightEmail: {
    color: brandColor,
    fontWeight: '700',
  },
  input: {
    width: inputWidth,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    borderRadius: 12,
    width: inputWidth,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  resendContainer: {
    paddingVertical: 10,
  },
  resendText: {
    fontSize: 15,
    color: brandColor,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginFallback: {
    marginTop: 20,
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  }
});