// app/chat-room.tsx
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useTheme } from "./contexts/ThemeContext";

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: 'text' | 'image' | 'document' | 'voice' | 'video';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList>(null);
  const recordingAnimation = useRef(new Animated.Value(0)).current;

  // Dynamically get the chat details from the route parameters
  const { conversationId, recipientId, recipientNameParam } = useLocalSearchParams<{
    conversationId: string;
    recipientId: string;
    recipientNameParam: string;
  }>();

  const recipientName = recipientNameParam || "User";
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [isOnline, setIsOnline] = useState(true); // Can be wired to presence later

  // 1. Initialize User & Messages
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to chat.");
        router.back();
        return;
      }
      setCurrentUserId(user.id);

      if (conversationId) {
        // Fetch historical messages
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          setMessages(data.map(msg => ({
            ...msg,
            status: msg.sender_id === user.id ? 'sent' : 'delivered'
          })));
          
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 200);
        }
      }
    };

    initChat();
  }, [conversationId]);

  // 2. Real-time Subscription for Incoming Messages
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // If the message is NOT from us, add it to the list (we add ours optimistically)
          if (newMsg.sender_id !== currentUserId) {
            setMessages(prev => [...prev, { ...newMsg, status: 'delivered' }]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  // 3. Send Text Message
  const sendMessage = async () => {
    if (newMessage.trim() === "" || !currentUserId || !conversationId) return;

    const msgContent = newMessage.trim();
    const tempId = Date.now().toString();

    // Optimistic UI update
    const tempMessage: Message = {
      id: tempId,
      content: msgContent,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      message_type: 'text',
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    setInputHeight(40);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Push to DB
    const { data, error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: recipientId, // Required by your table
        content: msgContent,
        message_type: 'text',
        is_read: false
      }
    ]).select().single();

    if (error) {
      console.error("Send error:", error);
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg));
    } else {
      // Replace temp message with real DB message to get the real UUID
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...data, status: 'sent' } : msg));
      
      // Update Conversation updated_at timestamp
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }
  };

  // 4. Upload File helper
  const uploadToStorage = async (uri: string, type: 'image' | 'document') => {
    if (!currentUserId) throw new Error("Not logged in");
    
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    
    const ext = uri.split('.').pop() || (type === 'image' ? 'jpeg' : 'pdf');
    const fileName = `${currentUserId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, arrayBuffer, {
        contentType: type === 'image' ? 'image/jpeg' : '*/*',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // 5. Send File Message
  const sendFileMessage = async (fileUri: string, messageType: 'image' | 'document', fileName?: string, fileSize?: number) => {
    if (!currentUserId || !conversationId) return;

    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content: messageType === 'image' ? '📷 Photo' : `📄 ${fileName || 'Document'}`,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      message_type: messageType,
      status: 'sending',
      image_url: messageType === 'image' ? fileUri : undefined,
      file_url: messageType === 'document' ? fileUri : undefined,
      file_name: fileName,
      file_size: fileSize
    };

    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Actually upload
      const publicUrl = await uploadToStorage(fileUri, messageType);

      // Insert to DB
      const { data, error } = await supabase.from("messages").insert([
        {
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: recipientId,
          content: tempMessage.content,
          message_type: messageType,
          image_url: messageType === 'image' ? publicUrl : null,
          file_url: messageType === 'document' ? publicUrl : null,
          file_name: fileName,
          file_size: fileSize,
          is_read: false
        }
      ]).select().single();

      if (error) throw error;

      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...data, status: 'sent' } : msg));
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      
    } catch (err) {
      console.error("File upload/send error:", err);
      Alert.alert("Error", "Failed to send attachment.");
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg));
    }
  };

  // Attachment Handlers
  const handleAttachment = async (type: string) => {
    setShowAttachmentOptions(false);
    try {
      switch (type) {
        case 'camera':
          await handleCamera();
          break;
        case 'gallery':
          await handleGallery();
          break;
        case 'document':
          await handleDocument();
          break;
      }
    } catch (error) {
      console.error('Attachment error:', error);
      Alert.alert("Error", "Failed to process attachment. Please try again.");
    }
  };

  const handleCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      await sendFileMessage(result.assets[0].uri, 'image');
    }
  };

  const handleGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow gallery access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      await sendFileMessage(result.assets[0].uri, 'image');
    }
  };

  const handleDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      const doc = result.assets[0];
      await sendFileMessage(doc.uri, 'document', doc.name, doc.size);
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      Animated.timing(recordingAnimation, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      Alert.alert("Voice Note", "Voice recording functionality requires native setup.");
    } else {
      setIsRecording(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, { toValue: 1, duration: 1000, useNativeDriver: false }),
          Animated.timing(recordingAnimation, { toValue: 0, duration: 1000, useNativeDriver: false }),
        ])
      ).start();
    }
  };

  // Formatters
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending': return <Ionicons name="time-outline" size={12} color={theme?.textSecondary ?? "#999"} />;
      case 'sent': return <Ionicons name="checkmark-outline" size={12} color={theme?.textSecondary ?? "#999"} />;
      case 'delivered': return <Ionicons name="checkmark-done-outline" size={12} color={theme?.textSecondary ?? "#999"} />;
      case 'read': return <Ionicons name="checkmark-done-outline" size={12} color="#10b981" />;
      case 'failed': return <Ionicons name="alert-circle-outline" size={12} color="#ef4444" />;
      default: return null;
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender_id === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const showAvatar = !isMyMessage && (nextMessage?.sender_id !== item.sender_id || !nextMessage);
    const isFirstInGroup = prevMessage?.sender_id !== item.sender_id;
    const isLastInGroup = nextMessage?.sender_id !== item.sender_id;

    // We check both image_url and file_url for compatibility with DB structure
    const displayImageUrl = item.image_url || item.file_url;

    const renderMessageContent = () => {
      switch (item.message_type) {
        case 'image':
          return (
            <View style={styles.imageMessageContainer}>
              {displayImageUrl && (
                <Image 
                  source={{ uri: displayImageUrl }} 
                  style={styles.imageMessage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.messageInfo}>
                <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                  {formatTime(item.created_at)}
                </Text>
                {isMyMessage && <View style={styles.messageStatus}>{getStatusIcon(item.status)}</View>}
              </View>
            </View>
          );
        
        case 'document':
          return (
            <View style={styles.documentMessageContainer}>
              <View style={styles.documentIcon}>
                <Ionicons name="document" size={24} color={theme?.primary ?? "#4B56E9"} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={[styles.documentName, isMyMessage ? styles.myMessageText : styles.otherMessageText]} numberOfLines={1}>
                  {item.file_name || 'Document'}
                </Text>
                {item.file_size && (
                  <Text style={[styles.documentSize, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                    {formatFileSize(item.file_size)}
                  </Text>
                )}
              </View>
              <View style={styles.messageInfo}>
                <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                  {formatTime(item.created_at)}
                </Text>
                {isMyMessage && <View style={styles.messageStatus}>{getStatusIcon(item.status)}</View>}
              </View>
            </View>
          );
        
        default:
          return (
            <>
              <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                {item.content}
              </Text>
              <View style={styles.messageInfo}>
                <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                  {formatTime(item.created_at)}
                </Text>
                {isMyMessage && <View style={styles.messageStatus}>{getStatusIcon(item.status)}</View>}
              </View>
            </>
          );
      }
    };

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        isFirstInGroup && styles.firstInGroup,
        isLastInGroup && styles.lastInGroup
      ]}>
        {showAvatar && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{recipientName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isFirstInGroup && (isMyMessage ? styles.myFirstBubble : styles.otherFirstBubble),
          isLastInGroup && (isMyMessage ? styles.myLastBubble : styles.otherLastBubble),
          item.message_type === 'image' && styles.imageMessageBubble,
          item.message_type === 'document' && styles.documentMessageBubble
        ]}>
          {renderMessageContent()}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme?.text ?? "#333"} />
          </TouchableOpacity>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>{recipientName.charAt(0).toUpperCase()}</Text>
              {isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{recipientName}</Text>
              <Text style={styles.contactStatus}>
                {isOnline ? 'Online' : 'Last seen recently'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn}>
              <Ionicons name="videocam" size={22} color={theme?.primary ?? "#4B56E9"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn}>
              <Ionicons name="call" size={22} color={theme?.primary ?? "#4B56E9"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot]} />
                <View style={[styles.typingDot]} />
                <View style={[styles.typingDot]} />
              </View>
            </View>
          </View>
        )}

        {/* Attachment Options */}
        {showAttachmentOptions && (
          <View style={styles.attachmentOptions}>
            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={() => handleAttachment('camera')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: '#ef4444' }]}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
              <Text style={styles.attachmentLabel}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={() => handleAttachment('gallery')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="images" size={20} color="#fff" />
              </View>
              <Text style={styles.attachmentLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={() => handleAttachment('document')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="document" size={20} color="#fff" />
              </View>
              <Text style={styles.attachmentLabel}>Document</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachmentBtn}
            onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
          >
            <Ionicons 
              name={showAttachmentOptions ? "close" : "add"} 
              size={22} 
              color={theme?.primary ?? "#4B56E9"} 
            />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
              placeholder="Type a message..."
              placeholderTextColor={theme?.textSecondary ?? "#999"}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              onContentSizeChange={(e) => 
                setInputHeight(Math.min(120, e.nativeEvent.contentSize.height))
              }
              maxLength={1000}
            />
          </View>

          {newMessage.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.voiceBtn, isRecording && styles.voiceBtnRecording]}
              onPress={handleVoiceRecording}
              onLongPress={handleVoiceRecording}
            >
              <Animated.View style={{
                opacity: recordingAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.3]
                })
              }}>
                <Ionicons 
                  name={isRecording ? "stop" : "mic"} 
                  size={20} 
                  color={isRecording ? "#fff" : theme?.primary ?? "#4B56E9"} 
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.background ?? "#f8f9fa",
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 40,
      backgroundColor: theme?.background ?? "#fff",
      borderBottomWidth: 1,
      borderBottomColor: theme?.border ?? "#e1e5e9",
    },
    backBtn: {
      padding: 8,
      marginRight: 8,
    },
    contactInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    contactAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme?.primary ?? "#4B56E9",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      position: "relative",
    },
    contactAvatarText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    onlineIndicator: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#10b981",
      borderWidth: 2,
      borderColor: "#fff",
    },
    contactDetails: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme?.text ?? "#1a1d21",
    },
    contactStatus: {
      fontSize: 12,
      color: theme?.textSecondary ?? "#6b7280",
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerActionBtn: {
      padding: 8,
      marginLeft: 4,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingBottom: 20,
    },
    messageContainer: {
      flexDirection: "row",
      marginVertical: 1,
      maxWidth: width * 0.8,
    },
    myMessageContainer: {
      alignSelf: "flex-end",
      flexDirection: "row-reverse",
    },
    otherMessageContainer: {
      alignSelf: "flex-start",
    },
    firstInGroup: {
      marginTop: 8,
    },
    lastInGroup: {
      marginBottom: 8,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme?.textSecondary ?? "#999",
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 8,
      marginTop: 4,
    },
    avatarText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    messageBubble: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      maxWidth: "100%",
    },
    myMessageBubble: {
      backgroundColor: theme?.primary ?? "#4B56E9",
      marginLeft: 8,
    },
    otherMessageBubble: {
      backgroundColor: theme?.surface ?? "#fff",
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      marginRight: 8,
    },
    imageMessageBubble: {
      padding: 4,
    },
    documentMessageBubble: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    myFirstBubble: {
      borderTopRightRadius: 6,
    },
    myLastBubble: {
      borderBottomRightRadius: 6,
    },
    otherFirstBubble: {
      borderTopLeftRadius: 6,
    },
    otherLastBubble: {
      borderBottomLeftRadius: 6,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    myMessageText: {
      color: "#fff",
    },
    otherMessageText: {
      color: theme?.text ?? "#1a1d21",
    },
    messageInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    messageTime: {
      fontSize: 11,
      marginRight: 4,
    },
    myMessageTime: {
      color: "rgba(255, 255, 255, 0.7)",
    },
    otherMessageTime: {
      color: theme?.textSecondary ?? "#6b7280",
    },
    messageStatus: {
      marginLeft: 2,
    },
    imageMessageContainer: {
      minWidth: 200,
    },
    imageMessage: {
      width: 200,
      height: 200,
      borderRadius: 16,
      marginBottom: 4,
    },
    documentMessageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 200,
    },
    documentIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme?.background ?? '#f8f9fa',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    documentSize: {
      fontSize: 12,
    },
    typingContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    typingBubble: {
      alignSelf: "flex-start",
      backgroundColor: theme?.surface ?? "#fff",
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginLeft: 48,
    },
    typingDots: {
      flexDirection: "row",
      alignItems: "center",
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme?.textSecondary ?? "#6b7280",
      marginHorizontal: 2,
    },
    attachmentOptions: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme?.surface ?? "#fff",
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? "#e1e5e9",
    },
    attachmentOption: {
      alignItems: "center",
      marginRight: 24,
    },
    attachmentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    attachmentLabel: {
      fontSize: 12,
      color: theme?.textSecondary ?? "#6b7280",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 32,
      backgroundColor: theme.background,
      borderTopWidth: 0,
      borderTopColor: theme?.border ?? "#e1e5e9",
    },
    attachmentBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      marginBottom: 2,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: theme?.background ?? "#f8f9fa",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
    },
    textInput: {
      fontSize: 16,
      color: theme?.text ?? "#1a1d21",
      maxHeight: 120,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme?.primary ?? "#4B56E9",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    voiceBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme?.background ?? "#f8f9fa",
      borderWidth: 1,
      borderColor: theme?.border ?? "#e1e5e9",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    voiceBtnRecording: {
      backgroundColor: "#ef4444",
      borderColor: "#ef4444",
    },
  });