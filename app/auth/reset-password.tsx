// app/auth/reset-password.tsx
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';
const inputWidth = 320;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  // State to manage the 2-step flow
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Step 1: Request the 8-digit reset code
  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', 'We sent an 8-digit reset code to your email.');
      setStep(2); // Move to Step 2
    }
  };

  // Step 2: Verify code and update password
  const handleResetPassword = async () => {
    if (!code || code.length !== 8) {
      Alert.alert('Invalid Code', 'Please enter the full 8-digit code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'Your new password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    
    // First, verify the OTP which temporarily logs the user in
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });

    if (verifyError) {
      setLoading(false);
      Alert.alert('Verification Failed', verifyError.message);
      return;
    }

    // Second, now that they are verified, update their password to the new one
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      Alert.alert('Update Failed', updateError.message);
    } else {
      Alert.alert('Success!', 'Your password has been reset successfully. Please log in.');
      
      // Sign the user out of the temporary recovery session
      await supabase.auth.signOut();
      
      // Route them back to the login screen
      router.replace('/auth/login'); 
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {step === 1 ? (
        // --- STEP 1 UI: GET EMAIL ---
        <>
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subheading}>
            Enter your email address and we'll send you an 8-digit code to reset your password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.textTertiary}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRequestCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        // --- STEP 2 UI: ENTER CODE & NEW PASSWORD ---
        <>
          <Text style={styles.heading}>Create New Password</Text>
          <Text style={styles.subheading}>
            Enter the 8-digit code sent to <Text style={styles.highlightEmail}>{email}</Text> and your new password.
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="8-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={8}
            placeholderTextColor={theme.textTertiary}
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholderTextColor={theme.textTertiary}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Back to Login Button */}
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
    marginBottom: 20,
    fontSize: 16,
    color: theme.text,
  },
  codeInput: {
    width: inputWidth,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
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
  loginFallback: {
    marginTop: 10,
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  }
});