import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';
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
  avatarUrl?: string | null;
}

export default function SellerChatInboxScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      buttons: buttons || [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })), style: 'default' }]
    });
  };

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const fetchConversations = async () => {
    try {
      // 1. Strict Session Guard
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error("Authentication required to view messages.");
      }
      
      const user = session.user;
      setCurrentUserId(user.id);

      // 2. Fetch Conversations for this Seller
      const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select('id, buyer_id, updated_at')
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      // 3. Profiles-First Architecture: Map over convos to fetch Buyer Identity AND Last Message
      const mappedConvos = await Promise.all((convos || []).map(async (convo) => {
        // Fetch last message details
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const lastMsg = messages && messages.length > 0 ? messages[0] : null;
        const unread = messages ? messages.filter(m => !m.is_read && m.sender_id !== user.id).length : 0;

        // Fetch Buyer Identity from Profiles Table
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', convo.buyer_id)
          .single();

        const buyerName = buyerProfile?.username || buyerProfile?.full_name || 'Customer';

        return {
          id: convo.id,
          buyer_id: convo.buyer_id,
          updated_at: convo.updated_at,
          lastMessage: lastMsg ? lastMsg.content : 'Started a conversation',
          lastMessageTime: lastMsg ? lastMsg.created_at : convo.updated_at,
          unreadCount: unread,
          recipientName: buyerName,
          avatarUrl: buyerProfile?.avatar_url,
        };
      }));

      setConversations(mappedConvos);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      showAlert("Inbox Error", error.message || "Failed to load your messages.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  // --- Real-time Chat Inbox Logic ---
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('public:messages:inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new;
          
          setConversations((prevConvos) => {
            const convoIndex = prevConvos.findIndex(c => c.id === newMessage.conversation_id);
            
            // If this is a completely new conversation, refetch the whole list
            if (convoIndex === -1) {
              fetchConversations();
              return prevConvos;
            }

            // Update the existing conversation with new message data
            const updatedConvos = [...prevConvos];
            const convo = updatedConvos[convoIndex];
            
            const isUnread = !newMessage.is_read && newMessage.sender_id !== currentUserId;
            
            updatedConvos[convoIndex] = {
              ...convo,
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at,
              unreadCount: isUnread ? convo.unreadCount + 1 : convo.unreadCount,
            };

            // Resort to bring the updated conversation to the top
            return updatedConvos.sort((a, b) => 
              new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const openChat = (convo: Conversation) => {
    // WhatsApp Logic: Optimistically clear the unread count when navigating into the chat
    setConversations(prev => 
      prev.map(c => c.id === convo.id ? { ...c, unreadCount: 0 } : c)
    );

    router.push({
      pathname: '/chat-room',
      params: {
        conversationId: convo.id,
        recipientId: convo.buyer_id,
        recipientNameParam: convo.recipientName,
        recipientAvatarParam: convo.avatarUrl || '', // Pass avatar to the room so it doesn't have to refetch immediately
      }
    });
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
      ) : conversations.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.textTertiary || '#999'} style={{ marginBottom: 16 }} />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>No Messages Yet</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8 }}>When customers contact you, chats will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.convoItem} 
              onPress={() => openChat(item)}
              activeOpacity={0.7}
            >
              {/* Dynamic Avatar UI */}
              <View style={[styles.avatarContainer, !item.avatarUrl && { backgroundColor: '#10B981' }]}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color="#fff" />
                )}
              </View>
              
              <View style={styles.convoDetails}>
                <Text style={styles.recipientName}>{item.recipientName}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              {/* Unread Badge (if any) */}
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowSearchModal(true)}>
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Search/New Chat Modal */}
      <Modal visible={showSearchModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              <Text style={styles.modalTitle}>Find Customer</Text>
            </View>
            <View style={styles.searchContainer}>
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search by username..." 
                placeholderTextColor={theme.textSecondary || '#999'}
                value={searchQuery} 
                onChangeText={setSearchQuery} 
              />
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
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  convoItem: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' },
  avatarContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  convoDetails: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  recipientName: { fontSize: 17, fontWeight: '700', color: theme.text, marginBottom: 4 },
  lastMessage: { fontSize: 15, color: theme.textSecondary },
  unreadBadge: { backgroundColor: brandColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: brandColor, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { height: '90%', backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginLeft: 20 },
  searchContainer: { backgroundColor: theme.surface, padding: 15, borderRadius: 12 },
  searchInput: { fontSize: 16, color: theme.text },
  
  // Custom Alert Modal Styles
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