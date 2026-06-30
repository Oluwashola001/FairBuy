// app/help.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from './contexts/ThemeContext';

const brandColor = '#4B56E9';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  isQuickReply?: boolean;
}

const FAQ_DATA = [
  {
    question: "How do I become a seller?",
    answer: "It's easy! Go to the 'Profile' tab and tap the 'Become a Seller' button. You'll just need to provide your store name, category, and basic bank details to get started."
  },
  {
    question: "Where is my order?",
    answer: "You can track all your purchases in the 'Profile' tab under the 'My Recent Orders' section. You'll see real-time status updates there!"
  },
  {
    question: "Is my payment secure?",
    answer: "Absolutely. We use industry-standard encryption, and sellers only receive funds once the transaction clears successfully."
  },
  {
    question: "How do I contact a seller?",
    answer: "When viewing any product, just tap the 'Chat with Seller' button at the bottom of the screen. This opens a direct, secure messaging room with them."
  },
  {
    question: "How do sellers get paid?",
    answer: "Sellers can view their balance by tapping 'Earnings & Wallet' in the Seller Dashboard. From there, you can request a withdrawal to your registered bank account."
  }
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  // Typing animation values
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Initialize Welcome Message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        text: "Hi there! 👋 I'm the FairTrade Support Bot. How can I help you today? Choose an option below or type a question.",
        sender: 'bot'
      }
    ]);
  }, []);

  // Typing Indicator Animation
  useEffect(() => {
    if (isBotTyping) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true })
          ])
        ).start();
      };
      animateDot(dot1, 0);
      animateDot(dot2, 150);
      animateDot(dot3, 300);
    } else {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    }
  }, [isBotTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendResponse = (userText: string, botResponseText: string) => {
    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setShowOptions(false);
    scrollToBottom();

    // 2. Simulate Bot Typing
    setIsBotTyping(true);
    scrollToBottom();

    // 3. Add Bot Response after a short delay for realism
    setTimeout(() => {
      setIsBotTyping(false);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
      setShowOptions(true); // Show options again
      scrollToBottom();
    }, 1500);
  };

  const handleQuickReply = (faq: typeof FAQ_DATA[0]) => {
    handleSendResponse(faq.question, faq.answer);
  };

  const handleManualSend = () => {
    if (!inputText.trim()) return;
    
    const text = inputText.trim();
    setInputText('');
    
    // Simple logic: Check if we have an exact match or keywords, otherwise send fallback
    const lowercaseInput = text.toLowerCase();
    const matchedFaq = FAQ_DATA.find(faq => 
      lowercaseInput.includes(faq.question.toLowerCase().replace('?', '')) || 
      faq.question.toLowerCase().split(' ').some(word => word.length > 4 && lowercaseInput.includes(word))
    );

    const response = matchedFaq 
      ? matchedFaq.answer 
      : "I'm a simple bot and I might not understand everything yet! Please try selecting one of the quick options below, or email support@fairtrade.com for human assistance.";

    handleSendResponse(text, response);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === 'bot';
    
    return (
      <View style={[styles.messageRow, isBot ? styles.messageRowBot : styles.messageRowUser]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="headset" size={16} color="#fff" />
          </View>
        )}
        <View style={[styles.messageBubble, isBot ? styles.botBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Support Assistant</Text>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Area */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            <View>
              {/* Typing Indicator */}
              {isBotTyping && (
                <View style={[styles.messageRow, styles.messageRowBot]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="headset" size={16} color="#fff" />
                  </View>
                  <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                    <Animated.View style={[styles.dot, { opacity: dot1 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2 }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3 }]} />
                  </View>
                </View>
              )}
              
              {/* Quick Replies Tray */}
              {showOptions && !isBotTyping && (
                <View style={styles.quickRepliesContainer}>
                  <Text style={styles.quickRepliesTitle}>Common Questions</Text>
                  <View style={styles.chipsWrapper}>
                    {FAQ_DATA.map((faq, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.quickReplyChip}
                        onPress={() => handleQuickReply(faq)}
                      >
                        <Text style={styles.quickReplyText}>{faq.question}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask a question..."
              placeholderTextColor={theme.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleManualSend}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleManualSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  chatContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageRowBot: {
    alignSelf: 'flex-start',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brandColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  botBubble: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  userBubble: {
    backgroundColor: brandColor,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: theme.text,
  },
  userText: {
    color: '#fff',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.textSecondary,
    marginHorizontal: 3,
  },
  quickRepliesContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  quickRepliesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textTertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 42, // Align with bot bubbles
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 42,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(75, 86, 233, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickReplyText: {
    color: brandColor,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    color: theme.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brandColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: theme.textTertiary,
  },
});