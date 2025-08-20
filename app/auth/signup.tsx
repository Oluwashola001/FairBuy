import { supabase } from '@/lib/supabase';
import CheckBox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert, Dimensions, Image,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';
const inputWidth = 320;
const { height: screenHeight } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSignup = async () => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
    emailRedirectTo: 'exp://192.168.43.147:8081/--/auth/verified', 
  },
  });

  if (error) {
    Alert.alert(error.message);
  } else {
    Alert.alert(
      'Check your email for a verification link!',
      'Click the link to activate your account.'
    );
    router.push({
      pathname: '/auth/verify',
      params: { email },
    });
  }
};

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) Alert.alert(error.message);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={true}
    >
      <StatusBar style={theme.statusBar} />
      
      {/* Top spacing to allow scrolling up */}
      <View style={styles.topSpacer} />
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Create an Account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholderTextColor={theme.textTertiary}
          />

          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={theme.textTertiary}
          />

          <TextInput
            placeholder="Confirm Password"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor={theme.textTertiary}
          />

          {confirmPassword.length > 0 && confirmPassword !== password && (
            <Text style={styles.warningText}>Password does not match</Text>
          )}
        </View>

        <View style={styles.termsContainer}>
          <CheckBox
            value={termsAccepted}
            onValueChange={setTermsAccepted}
            color={termsAccepted ? brandColor : theme.border}
          />
          <Text style={styles.termsText}> I agree to the terms and privacy policy.</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: termsAccepted ? 1 : 0.5 }]}
          disabled={!termsAccepted || loading}
          onPress={handleSignup}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogle}>
          <View style={styles.googleContent}>
            <Image
              source={require('@/assets/images/google-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.buttonTextgoogle}>Continue with Google</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Bottom spacing for comfortable scrolling */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: theme.background,
  },
  topSpacer: {
    height: screenHeight * 0.08,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: screenHeight * 0.1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    width: inputWidth,
  },
  termsText: {
    marginLeft: 12,
    flex: 1,
    flexWrap: 'wrap',
    color: theme.textSecondary,
    fontSize: 15,
    lineHeight: 20,
  },
  warningText: {
    color: '#dc3545',
    marginBottom: 10,
    width: inputWidth,
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    width: inputWidth,
    shadowColor: brandColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButton: {
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: inputWidth,
    ...theme.shadow,
  },
  googleContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonTextgoogle: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
});