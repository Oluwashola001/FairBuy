// app/escrobond/release.tsx
// Local IDE version - preview disabled
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function ReleaseFundsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams();

  const [deal, setDeal] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "No deal ID provided.");
      router.back();
      return;
    }

    const fetchDeal = async () => {
      try {
        const { data, error } = await supabase
          .from('escrow_bonds')
          .select('*, seller:profiles!seller_id(username)')
          .eq('id', id as string)
          .single();

        if (error) throw error;
        setDeal(data);
      } catch (error: any) {
        console.error("Error fetching deal:", error);
        Alert.alert("Error", error.message || "Could not load deal details.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id]);

  const handleRelease = async () => {
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter your 4-digit PIN.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Verify PIN from the database
      const { data: verifyData, error: verifyError } = await supabase
        .from('escrow_bonds')
        .select('release_pin')
        .eq('id', id as string)
        .single();

      if (verifyError || !verifyData) throw new Error("Could not verify PIN.");

      // --- NEW SECURITY UPDATE: Hash the input and compare it to DB hash ---
      const hashedInputPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );

      if (verifyData.release_pin !== hashedInputPin) {
        throw new Error("Incorrect PIN. Please try again.");
      }

      // 2. TWO-FACTOR AUTHENTICATION: Biometric / Passcode Check
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify identity to authorize fund release',
          fallbackLabel: 'Use Device Passcode',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (!authResult.success) {
          throw new Error("Biometric verification failed or was cancelled.");
        }
      } else {
        // Fallback for devices without biometric/passcode setup
        Alert.alert(
          "Security Warning", 
          "Your device does not have a passcode or biometrics set up. Proceeding with PIN only."
        );
      }

      // 3. Update Status to 'Pending_Release' and set countdown timestamp
      const { error: updateError } = await supabase
        .from('escrow_bonds')
        .update({ 
          status: 'Pending_Release',
          release_initiated_at: new Date().toISOString() 
        })
        .eq('id', id as string);

      if (updateError) throw updateError;

      // 4. Go to Celebration Screen
      const sellerName = deal.seller?.username || deal.seller_identifier;
      router.replace({ 
        pathname: '/escrobond/success', 
        params: { amount: deal.amount, seller: sellerName, txId: deal.transaction_id } 
      });

    } catch (err: any) {
      console.error("Release error:", err);
      Alert.alert("Error", err.message || "Failed to initiate fund release.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(theme);

  if (loading || !deal) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={brandColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={theme?.text ?? "#1a1d21"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔓 Authorize Release</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Amount:</Text>
              <Text style={styles.amountValue}>${Number(deal.amount).toLocaleString()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Funds will be marked for release to:</Text>
              <View style={styles.toContainer}>
                <Text style={styles.toLabel}>To:</Text>
                <Text style={styles.toValue}>@{deal.seller?.username || deal.seller_identifier}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter your 4-digit PIN:</Text>
              <TextInput
                style={styles.pinInput}
                placeholder="••••"
                placeholderTextColor={theme?.textTertiary ?? "#9ca3af"}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                editable={!isSubmitting}
                autoFocus
              />
            </View>

            <View style={styles.warningBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" style={{ marginTop: 2 }} />
              <Text style={styles.warningText}>
                A <Text style={{ fontWeight: '700' }}>24-hour verification window</Text> will begin after you authorize this release.
              </Text>
            </View>

          </View>

          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleRelease}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="finger-print" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Verify & Release</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme?.background ?? "#f8f9fa" 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 16 : 40, 
    paddingBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: theme?.border ?? "#e1e5e9",
    backgroundColor: theme?.background ?? "#f8f9fa"
  },
  backBtn: { 
    padding: 8, 
    marginLeft: -8 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: theme?.text ?? "#1a1d21", 
    flex: 1, 
    textAlign: 'center' 
  },
  headerSpacer: { 
    width: 40 
  },
  content: { 
    flex: 1, 
    padding: 24 
  },
  amountCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: theme?.surface ?? "#fff", 
    padding: 24, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: theme?.border ?? "#e1e5e9", 
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  amountLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: theme?.text ?? "#1a1d21" 
  },
  amountValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: brandColor 
  },
  infoRow: { 
    marginBottom: 32 
  },
  infoLabel: { 
    fontSize: 15, 
    color: theme?.textSecondary ?? "#6b7280", 
    marginBottom: 12,
    fontWeight: '500'
  },
  toContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: theme?.surface ?? "#fff", 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: theme?.border ?? "#e1e5e9" 
  },
  toLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: theme?.textSecondary ?? "#6b7280" 
  },
  toValue: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: theme?.text ?? "#1a1d21" 
  },
  inputGroup: { 
    marginBottom: 24 
  },
  inputLabel: { 
    fontSize: 15, 
    color: theme?.textSecondary ?? "#6b7280", 
    marginBottom: 12,
    fontWeight: '500'
  },
  pinInput: { 
    backgroundColor: theme?.surface ?? "#fff", 
    borderWidth: 1, 
    borderColor: theme?.border ?? "#e1e5e9", 
    borderRadius: 20, 
    padding: 24, 
    fontSize: 32, 
    letterSpacing: 16, 
    textAlign: 'center', 
    color: theme?.text ?? "#1a1d21", 
    fontWeight: '800' 
  },
  warningBanner: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(16, 185, 129, 0.08)', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  warningText: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 14, 
    color: theme?.textSecondary ?? "#6b7280", 
    lineHeight: 22 
  },
  bottomContainer: { 
    marginTop: 'auto',
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, 
    backgroundColor: theme?.background ?? "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: theme?.border ?? "#e1e5e9"
  },
  primaryBtn: { 
    backgroundColor: brandColor, 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: brandColor, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    elevation: 8 
  },
  primaryBtnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
});