// app/escrobond/disclaimer.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function EscroBondDisclaimerScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { role } = useLocalSearchParams(); // 'buyer' or 'seller'
  
  const [agreed, setAgreed] = useState(false);

  const isBuyer = role !== 'seller';

  const handleProceed = () => {
    if (!agreed) return;
    
    if (isBuyer) {
      router.push('/escrobond/create');
    } else {
      // If seller, they might be generating a request link in future features, 
      // but for now, we just drop them back to their hub since buyers initiate.
      router.back(); 
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
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            <Text style={{ fontWeight: '700', color: '#F59E0B' }}>⚠️ This feature allows you to </Text>
            <Text style={{ fontWeight: '700', color: brandColor }}>
              {isBuyer ? 'lock' : 'sell'}
            </Text>
            <Text> funds for deals made outside the </Text>
            <Text style={{ fontWeight: '700', color: brandColor }}>FairTrade app</Text>.
          </Text>

          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="close" size={18} color="#EF4444" style={styles.ruleIcon} />
              <Text style={styles.ruleText}>
                <Text style={{ fontWeight: '700', color: '#EF4444' }}>No</Text> delivery tracking
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="close" size={18} color="#EF4444" style={styles.ruleIcon} />
              <Text style={styles.ruleText}>
                <Text style={{ fontWeight: '700', color: '#EF4444' }}>No</Text> dispute resolution
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="close" size={18} color="#EF4444" style={styles.ruleIcon} />
              <Text style={styles.ruleText}>
                <Text style={{ fontWeight: '700', color: '#EF4444' }}>No</Text> guarantees from the platform
              </Text>
            </View>
          </View>

          <Text style={styles.trustText}>
            Trade <Text style={{ fontWeight: '700', color: brandColor }}>only</Text> with someone you <Text style={{ fontWeight: '700', color: brandColor }}>trust</Text>!
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>I understand and agree to the risks</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.proceedBtn, !agreed && styles.proceedBtnDisabled]}
          onPress={handleProceed}
          disabled={!agreed}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedBtnText}>Proceed to Escrow Form</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.termsLink}>
          <Text style={styles.termsText}>
            Read our <Text style={styles.termsTextHighlight}>Terms & Conditions</Text>
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === 'ios' ? 30 : 60,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
  },
  warningText: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  rulesList: {
    marginBottom: 24,
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleIcon: {
    marginRight: 8,
  },
  ruleText: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  trustText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  proceedBtn: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  proceedBtnDisabled: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  termsLink: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  termsTextHighlight: {
    color: brandColor,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});