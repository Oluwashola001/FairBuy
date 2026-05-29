import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Mocking dependencies for local IDE testing
const supabase = { auth: { getUser: async () => ({ data: { user: { id: 'test' } } }) }, from: () => ({ select: () => ({ eq: () => ({ order: () => ({}) }) }) }) };
const Ionicons = (props: any) => <View />;
const useRouter = () => ({ push: () => {}, back: () => {} });
const useFocusEffect = (cb: any) => {};
const StatusBar = (props: any) => <View />;
const useTheme = () => ({ theme: { background: '#fff', text: '#000', surface: '#f0f0f0', border: '#e0e0e0', textSecondary: '#666', textTertiary: '#999', primary: '#4B56E9' }, isDark: false });

const brandColor = '#4B56E9';

interface Conversation {
  id: string;
  seller_id: string;
  updated_at: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  recipientName: string;
}

export default function BuyerChatInboxScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const renderConversation = ({ item }: { item: Conversation }) => (
    <View style={styles.convoItem}>
      <View style={styles.avatarContainer}><Ionicons name="storefront" /></View>
      <View style={styles.convoDetails}>
        <View style={styles.convoHeader}>
          <Text style={styles.recipientName}>{item.recipientName}</Text>
        </View>
      </View>
    </View>
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowSearchModal(true)}>
        <Ionicons name="search" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: theme.text },
  convoItem: { flexDirection: 'row', padding: 20 },
  avatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: brandColor },
  convoDetails: { flex: 1, paddingLeft: 16 },
  convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipientName: { fontSize: 17, fontWeight: '700', color: theme.text },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: brandColor, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { height: '90%', backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }
});