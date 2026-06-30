// app/escrobond/create.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function CreateEscroBondScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [sellerId, setSellerId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateDeal = async () => {
    // 1. Validation
    if (!sellerId.trim() || !amount.trim() || !pin.trim() || !confirmPin.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monetary amount.');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Your release PIN must be exactly 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The release PINs do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to create a deal.");

      // 2. Try to find the actual seller UUID in the database using their username/email
      let actualSellerUuid = null;
      const cleanIdentifier = sellerId.trim().toLowerCase();

      // Check username first, then email (if allowed by your RLS)
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.eq.${cleanIdentifier}`)
        .single();
        
      if (sellerProfile) {
        actualSellerUuid = sellerProfile.id;
      }

      // 3. Generate a Transaction ID
      const txId = `#OFF${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Set auto-release for 3 days from now
      const autoReleaseDate = new Date();
      autoReleaseDate.setDate(autoReleaseDate.getDate() + 3);

      // --- NEW SECURITY UPDATE: Hash the PIN ---
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );

      // 5. Insert the Escrow Bond
      const { data: newBond, error } = await supabase
        .from('escrow_bonds')
        .insert([{
          transaction_id: txId,
          buyer_id: user.id,
          seller_identifier: sellerId.trim(),
          seller_id: actualSellerUuid, 
          amount: parseFloat(amount),
          reason: reason.trim() || null,
          release_pin: hashedPin, // Saving the hash instead of plain text!
          status: 'Locked',
          auto_release_date: autoReleaseDate.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 6. Navigate to the summary screen
      router.push({ pathname: '/escrobond/summary', params: { id: newBond.id } });

    } catch (error: any) {
      console.error("Error creating escrow:", error);
      Alert.alert('Error', error.message || 'Could not lock funds.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🤝 Create EscroBond Deal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seller Username / Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seller@example.com or @username"
              placeholderTextColor={theme.textTertiary}
              value={sellerId}
              onChangeText={setSellerId}
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount to Lock ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15000"
              placeholderTextColor={theme.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Samsung Galaxy S10, Blue"
              placeholderTextColor={theme.textTertiary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.pinSection}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Release PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor={theme.textTertiary}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                editable={!isSubmitting}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Confirm PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor={theme.textTertiary}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={brandColor} />
            <Text style={styles.infoText}>
              Memorize this PIN. You will need to provide it to release the funds to the seller once you receive the item.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleCreateDeal}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Lock Funds in Escrow</Text>
            )}
          </TouchableOpacity>
          
          {/* Increased spacer from 40 to 150 to allow scrolling past the keyboard */}
          <View style={{ height: 150 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.surface,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  pinSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(75, 86, 233, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  submitBtn: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});