import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

interface UseLiveChatOptions {
  sessionId: string;
  userId: string | null;
  isLive: boolean;
}

export function useLiveChat({ sessionId, userId, isLive }: UseLiveChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSendTimeRef = useRef<number>(0);

  // Fetch initial messages (last 100)
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('live_chat')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
        setMessageCount(data?.length || 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch message count
  const fetchMessageCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_message_count', {
        p_session_id: sessionId,
      });

      if (!error && data !== null) {
        setMessageCount(data);
      }
    } catch (err) {
      console.error('Error fetching message count:', err);
    }
  };

  // Send a message
  const sendMessage = async (text: string): Promise<{ success: boolean; error?: string }> => {
    // Validation
    const trimmedText = text.trim();
    if (!trimmedText) {
      return { success: false, error: 'Message cannot be empty' };
    }

    if (!userId) {
      return { success: false, error: 'You must be signed in to chat' };
    }

    // Rate limiting (300ms)
    const now = Date.now();
    if (now - lastSendTimeRef.current < 300) {
      return { success: false, error: 'Please wait before sending another message' };
    }

    setSending(true);
    lastSendTimeRef.current = now;

    try {
      const { error } = await supabase
        .from('live_chat')
        .insert({
          session_id: sessionId,
          user_id: userId,
          message: trimmedText,
        });

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error sending message:', err);
      return { success: false, error: err.message };
    } finally {
      setSending(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchMessages();
    fetchMessageCount();

    // Subscribe to new messages
    const channel = supabase
      .channel(`live_chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
          setMessageCount((prev) => prev + 1);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId]);

  return {
    messages,
    messageCount,
    loading,
    sending,
    sendMessage,
  };
}
