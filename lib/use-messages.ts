import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  _optimistic?: boolean;
}

export function useMessages(conversationId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const optimisticIdCounter = useRef(0);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !userId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel: RealtimeChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          setMessages((prev) => {
            const optimisticIndex = prev.findIndex(
              (m) => m._optimistic && m.body === newMessage.body && m.sender_id === newMessage.sender_id
            );
            
            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = {
                ...newMessage,
                sender: prev[optimisticIndex].sender,
                _optimistic: false,
              };
              return updated;
            }

            return [...prev, newMessage];
          });

          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          if (senderData) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newMessage.id ? { ...m, sender: senderData } : m
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId || !userId || !body.trim()) return null;

      const optimisticId = `optimistic-${++optimisticIdCounter.current}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: userId,
        body: body.trim(),
        created_at: new Date().toISOString(),
        _optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const { data, error: sendError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            body: body.trim(),
          })
          .select()
          .single();

        if (sendError) throw sendError;

        return data;
      } catch (err: any) {
        console.error('Error sending message:', err);
        setError(err.message);
        
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        
        return null;
      }
    },
    [conversationId, userId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}
