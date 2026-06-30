// app/(tabs)/chat.tsx
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
  seller_id: string;
  updated_at: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  recipientName: string;
  avatarUrl?: string | null;
}

export default function BuyerChatInboxScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // FAB Search Modal States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // The actual database fetching logic
  const fetchConversations = async () => {
    try {
      // 1. Strict Session Guard
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error("Authentication required.");
      
      const user = session.user;
      setCurrentUserId(user.id);

      // 2. Fetch all conversations where user is the buyer
      const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select('id, seller_id, updated_at')
        .eq('buyer_id', user.id)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      // 3. Profiles-First Architecture: Map through to fetch Seller Identity & Last Message
      const mappedConvos = await Promise.all((convos || []).map(async (convo) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const lastMsg = messages && messages.length > 0 ? messages[0] : null;
        const unread = messages ? messages.filter(m => !m.is_read && m.sender_id !== user.id).length : 0;

        // Fetch Seller Identity from Profiles Table
        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select('store_name, username, full_name, avatar_url')
          .eq('id', convo.seller_id)
          .single();

        const sellerName = sellerProfile?.store_name || sellerProfile?.username || sellerProfile?.full_name || 'Seller';

        return {
          id: convo.id,
          seller_id: convo.seller_id,
          updated_at: convo.updated_at,
          lastMessage: lastMsg ? lastMsg.content : 'Started a conversation',
          lastMessageTime: lastMsg ? lastMsg.created_at : convo.updated_at,
          unreadCount: unread,
          recipientName: sellerName,
          avatarUrl: sellerProfile?.avatar_url,
        };
      }));

      setConversations(mappedConvos);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      showAlert("Inbox Error", error.message || "Could not load messages.");
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
      .channel('public:messages:buyer_inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new;
          
          setConversations((prevConvos) => {
            const convoIndex = prevConvos.findIndex(c => c.id === newMessage.conversation_id);
            
            // If this is a new conversation not tracked yet, refetch all
            if (convoIndex === -1) {
              fetchConversations();
              return prevConvos;
            }

            const updatedConvos = [...prevConvos];
            const convo = updatedConvos[convoIndex];
            
            const isUnread = !newMessage.is_read && newMessage.sender_id !== currentUserId;
            
            updatedConvos[convoIndex] = {
              ...convo,
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at,
              unreadCount: isUnread ? convo.unreadCount + 1 : convo.unreadCount,
            };

            // Resort to bring the active conversation to the top
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const openChat = (convo: Conversation) => {
    // WhatsApp Logic: Optimistically clear the unread count when navigating
    setConversations(prev => 
      prev.map(c => c.id === convo.id ? { ...c, unreadCount: 0 } : c)
    );

    router.push({
      pathname: '/chat-room',
      params: {
        conversationId: convo.id,
        recipientId: convo.seller_id,
        recipientNameParam: convo.recipientName,
        recipientAvatarParam: convo.avatarUrl || '',
      }
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.convoItem}
      onPress={() => openChat(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarContainer, !item.avatarUrl && { backgroundColor: brandColor }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="storefront" size={24} color="#fff" />
        )}
      </View>
      
      <View style={styles.convoDetails}>
        <View style={styles.convoHeader}>
          <Text style={styles.recipientName} numberOfLines={1}>{item.recipientName}</Text>
          <Text style={[styles.timeText, item.unreadCount > 0 && styles.timeTextUnread]}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <View style={styles.messageRow}>
          <Text 
            style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-horizontal-circle" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={theme.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>When you contact a seller, your conversations will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Action Button for searching users */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowSearchModal(true)}
      >
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Search User Modal */}
      <Modal visible={showSearchModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Message</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="at-outline" size={20} color={theme.textTertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <View style={styles.modalBody}>
              {searchQuery.trim() === '' ? (
                <View style={styles.placeholderState}>
                  <Ionicons name="people-circle-outline" size={48} color={theme.textTertiary} />
                  <Text style={styles.placeholderText}>Find sellers and friends</Text>
                </View>
              ) : (
                <View style={styles.placeholderState}>
                  <Text style={styles.placeholderText}>User search logic will be implemented here.</Text>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 15,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 100, // Make room for FAB
  },
  convoItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden', // Ensures images stay circular
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  convoDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    marginRight: 10,
  },
  timeText: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  timeTextUnread: {
    color: brandColor,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    color: theme.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  lastMessageUnread: {
    color: theme.text,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: brandColor,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: brandColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: brandColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '90%',
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    margin: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: theme.text,
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderState: {
    alignItems: 'center',
    opacity: 0.5,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },

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