import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: Profile;
};

interface UsePostCommentsProps {
  postId: string;
  userId: string | null;
}

interface UsePostCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (message: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export function usePostComments({ postId, userId }: UsePostCommentsProps): UsePostCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('post_comments')
          .select(`
            *,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (fetchError) throw fetchError;
        setComments(data || []);
      } catch (err: any) {
        console.error('Error fetching comments:', err);
        setError(err.message || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // Set up realtime subscription
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      channel = supabase
        .channel(`post-comments:${postId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'post_comments',
            filter: `post_id=eq.${postId}`,
          },
          async (payload) => {
            // Fetch the new comment with profile data
            const { data: newComment } = await supabase
              .from('post_comments')
              .select(`
                *,
                profiles (
                  id,
                  username,
                  display_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (newComment) {
              setComments((prev) => [...prev, newComment]);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'post_comments',
            filter: `post_id=eq.${postId}`,
          },
          (payload) => {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [postId]);

  const addComment = useCallback(
    async (message: string) => {
      if (!userId || !message.trim()) return;

      try {
        const { data, error: addError } = await supabase.rpc('add_comment_and_increment', {
          p_post_id: postId,
          p_message: message.trim(),
        });

        if (addError) throw addError;
      } catch (err: any) {
        console.error('Error adding comment:', err);
        throw err;
      }
    },
    [postId, userId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!userId) return;

      try {
        const { data, error: deleteError } = await supabase.rpc('delete_comment_and_decrement', {
          p_comment_id: commentId,
        });

        if (deleteError) throw deleteError;
        
        if (data && !data.success) {
          throw new Error(data.error || 'Failed to delete comment');
        }
      } catch (err: any) {
        console.error('Error deleting comment:', err);
        throw err;
      }
    },
    [userId]
  );

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
  };
}
