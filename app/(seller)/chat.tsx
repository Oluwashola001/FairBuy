import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Assuming the user has this structure locally
import { useTheme } from '../contexts/ThemeContext';

const brandColor = '#4B56E9';

interface Conversation {
  id: string;
  buyer_id: string;
  updated_at: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  recipientName: string;
}

export default function SellerChatInboxScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select('id, buyer_id, updated_at')
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      const mappedConvos = await Promise.all((convos || []).map(async (convo) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const lastMsg = messages && messages.length > 0 ? messages[0] : null;
        const unread = messages ? messages.filter(m => !m.is_read && m.sender_id !== user.id).length : 0;

        return {
          id: convo.id,
          buyer_id: convo.buyer_id,
          updated_at: convo.updated_at,
          lastMessage: lastMsg ? lastMsg.content : 'Started a conversation',
          lastMessageTime: lastMsg ? lastMsg.created_at : convo.updated_at,
          unreadCount: unread,
          recipientName: 'Customer',
        };
      }));

      setConversations(mappedConvos);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Inbox</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convoItem} onPress={() => {}}>
              <View style={[styles.avatarContainer, { backgroundColor: '#10B981' }]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.convoDetails}>
                <Text style={styles.recipientName}>{item.recipientName}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowSearchModal(true)}>
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showSearchModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              <Text style={styles.modalTitle}>Find Customer</Text>
            </View>
            <View style={styles.searchContainer}>
              <TextInput style={styles.searchInput} placeholder="Search by username..." value={searchQuery} onChangeText={setSearchQuery} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  convoItem: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  avatarContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  convoDetails: { flex: 1, justifyContent: 'center' },
  recipientName: { fontSize: 17, fontWeight: '700', color: theme.text },
  lastMessage: { fontSize: 15, color: theme.textSecondary },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: brandColor, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { height: '90%', backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginLeft: 20 },
  searchContainer: { backgroundColor: theme.surface, padding: 15, borderRadius: 12 },
  searchInput: { fontSize: 16, color: theme.text }
});