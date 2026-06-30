// app/auth/onboarding.tsx
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- Modern, recommended import
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Global Custom Modal State ---
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', onPress: () => hideAlert(), style: 'default' }]
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Get current user ID on load
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        // Pre-fill avatar if Google gave us one
        if (user.user_metadata?.avatar_url) {
          setProfileImage(user.user_metadata.avatar_url);
        }
      }
    });
  }, []);

  // Debounced Username Availability Check
  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      const cleanUsername = username.toLowerCase().trim();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .single();

      setIsCheckingUsername(false);

      if (data) {
        setIsUsernameAvailable(false); // It exists, so it's NOT available
      } else {
        setIsUsernameAvailable(true); // It doesn't exist, it IS available
      }
    };

    // Wait 500ms after user stops typing to check DB
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permission Required', 'We need access to your photos to set an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleCompleteSetup = async () => {
    if (!userId) return;
    if (username.length < 3) {
      showAlert('Invalid Username', 'Username must be at least 3 characters long.');
      return;
    }
    if (isUsernameAvailable === false) {
      showAlert('Username Taken', 'Please choose a different username.');
      return;
    }

    setIsSaving(true);
    try {
      let finalAvatarUrl = profileImage;

      // 1. If they picked a new local image, upload it
      if (profileImage && !profileImage.startsWith('http')) {
        const response = await fetch(profileImage);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const fileExt = profileImage.split('.').pop() || 'jpeg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, { 
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      }

      // 2. UPSERT everything to the profiles table (Updates existing row, inserts if missing)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: userId,
          username: username.toLowerCase().trim(),
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        }]);

      if (profileError) throw profileError;

      // 3. Update auth metadata as a backup
      await supabase.auth.updateUser({
        data: { username: username.toLowerCase().trim(), avatar_url: finalAvatarUrl }
      });

      // 4. Send them to the marketplace!
      router.replace('/(tabs)/home');

    } catch (error: any) {
      showAlert('Setup Failed', error.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Global Custom UI Modal for Alerts */}
      <Modal visible={alertConfig.visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.modalOverlayAlert}>
          <View style={styles.modalAlertContainer}>
            <Text style={styles.modalAlertTitle}>{alertConfig.title}</Text>
            <Text style={styles.modalAlertMessage}>{alertConfig.message}</Text>
            <View style={styles.modalAlertButtonGroup}>
              {alertConfig.buttons?.map((btn, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) setTimeout(btn.onPress, 100);
                  }}
                  style={[
                    styles.modalAlertBtn,
                    btn.style === 'destructive' ? styles.modalAlertBtnDestructive : 
                    btn.style === 'cancel' ? styles.modalAlertBtnCancel : styles.modalAlertBtnDefault
                  ]}
                >
                  <Text style={[
                    styles.modalAlertBtnText,
                    btn.style === 'cancel' ? { color: theme.text } : { color: '#fff' }
                  ]}>
                    {btn.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to FairTrade!</Text>
            <Text style={styles.subtitle}>Let's set up your profile so the community knows who you are.</Text>
          </View>

          {/* Avatar Upload */}
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={theme.textTertiary} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Add a profile picture (Optional)</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Choose a Username <Text style={{color: '#EF4444'}}>*</Text></Text>
            <View style={[
              styles.inputWrapper, 
              isUsernameAvailable === true && styles.inputSuccess,
              isUsernameAvailable === false && styles.inputError
            ]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="nightking007"
                placeholderTextColor={theme.textTertiary}
                value={username}
                onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))} // Restrict to alphanumeric
                autoCapitalize="none"
                maxLength={20}
              />
              {isCheckingUsername && <ActivityIndicator size="small" color={brandColor} style={{ marginRight: 10 }}/>}
              {!isCheckingUsername && isUsernameAvailable === true && <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 10 }} />}
              {!isCheckingUsername && isUsernameAvailable === false && <Ionicons name="close-circle" size={20} color="#EF4444" style={{ marginRight: 10 }} />}
            </View>
            
            {/* Status Messages */}
            {!isCheckingUsername && isUsernameAvailable === false && (
              <Text style={styles.errorText}>Username is already taken.</Text>
            )}
            {username.length > 0 && username.length < 3 && (
              <Text style={styles.errorText}>Username must be at least 3 characters.</Text>
            )}
            <Text style={styles.helperText}>This will be your unique identity on FairTrade.</Text>
          </View>

          <View style={styles.spacer} />

          {/* Complete Button */}
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              (!username || isUsernameAvailable === false || username.length < 3 || isSaving) && styles.buttonDisabled
            ]} 
            onPress={handleCompleteSetup}
            disabled={!username || isUsernameAvailable === false || username.length < 3 || isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{isSaving ? 'Saving Profile...' : 'Complete Setup'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 40 : 60, paddingBottom: 40 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  avatarContainer: { alignSelf: 'center', marginBottom: 12, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.surface, borderWidth: 4, borderColor: theme.surface },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: theme.surface },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: brandColor, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.background },
  avatarHint: { textAlign: 'center', color: theme.textSecondary, fontSize: 14, marginBottom: 40 },
  inputContainer: { width: '100%' },
  label: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, height: 56 },
  inputSuccess: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  inputError: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  atSymbol: { fontSize: 18, color: theme.textSecondary, fontWeight: '600', paddingLeft: 16, paddingRight: 4 },
  input: { flex: 1, fontSize: 18, color: theme.text, height: '100%', fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 6, fontWeight: '500' },
  helperText: { color: theme.textSecondary, fontSize: 13, marginTop: 6 },
  spacer: { flex: 1, minHeight: 40 }, 
  primaryButton: { backgroundColor: brandColor, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: brandColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  modalOverlayAlert: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  modalAlertContainer: { backgroundColor: theme.card || "#fff", borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: theme.border || "#e1e5e9", shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 20 },
  modalAlertTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text || "#000", marginBottom: 8, textAlign: 'center' },
  modalAlertMessage: { fontSize: 15, color: theme.textSecondary || "#666", marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  modalAlertButtonGroup: { flexDirection: 'column', gap: 12 },
  modalAlertBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalAlertBtnDefault: { backgroundColor: brandColor },
  modalAlertBtnDestructive: { backgroundColor: '#EF4444' },
  modalAlertBtnCancel: { backgroundColor: theme.surface || "#f0f0f0", borderWidth: 1, borderColor: theme.border || "#e1e5e9" },
  modalAlertBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});