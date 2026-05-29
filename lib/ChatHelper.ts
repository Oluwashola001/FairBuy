import { supabase } from '../lib/supabase'; // Adjust path to your supabase client

/**
 * Sends a message to the database safely
 */
export const sendMessage = async (conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'voice' = 'text', fileData: any = null) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content: content,
          message_type: type,
          file_name: fileData?.name || null,
          file_url: fileData?.url || null,
        }
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Database Send Error:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Wraps camera/media operations in error handling
 */
export const safeUpload = async (fileUri: string, bucketName: string, fileName: string) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, blob);

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Upload Error:", err.message);
    return { success: false, error: err.message };
  }
};