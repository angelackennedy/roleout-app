import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseCommentCountProps {
  postId: string;
}

interface UseCommentCountReturn {
  commentCount: number;
}

export function useCommentCount({ postId }: UseCommentCountProps): UseCommentCountReturn {
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (error) throw error;
        setCommentCount(count || 0);
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };

    fetchCommentCount();

    // Set up realtime subscription to update count
    const channel = supabase
      .channel(`comment-count:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          setCommentCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          setCommentCount(prev => Math.max(0, prev - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return { commentCount };
}
