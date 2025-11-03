import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface ConversationWithDetails {
  id: string;
  created_at: string;
  other_user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: {
    body: string;
    created_at: string;
    sender_id: string;
  } | null;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = memberData.map(m => m.conversation_id);

      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('created_at', { ascending: false });

      if (convosError) throw convosError;

      const conversationsWithDetails: ConversationWithDetails[] = [];

      for (const convo of convos || []) {
        const { data: members, error: membersError } = await supabase
          .from('conversation_members')
          .select('user_id, profiles!inner(id, username, display_name, avatar_url)')
          .eq('conversation_id', convo.id)
          .neq('user_id', userId);

        if (membersError) {
          console.error('Error fetching members:', membersError);
          continue;
        }

        if (!members || members.length === 0) continue;

        const otherUser = (members[0] as any).profiles;

        const { data: lastMsg, error: msgError } = await supabase
          .from('messages')
          .select('body, created_at, sender_id')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (msgError && msgError.code !== 'PGRST116') {
          console.error('Error fetching last message:', msgError);
        }

        conversationsWithDetails.push({
          id: convo.id,
          created_at: convo.created_at,
          other_user: {
            id: otherUser?.id || '',
            username: otherUser?.username || '',
            display_name: otherUser?.display_name || null,
            avatar_url: otherUser?.avatar_url || null,
          },
          last_message: lastMsg || null,
        });
      }

      conversationsWithDetails.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationsWithDetails);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}
