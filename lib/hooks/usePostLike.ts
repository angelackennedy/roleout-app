import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePostLikeProps {
  postId: string;
  initialLikeCount: number;
  userId: string | null;
}

interface UsePostLikeReturn {
  isLiked: boolean;
  likeCount: number;
  toggleLike: () => Promise<void>;
  isLoading: boolean;
}

export function usePostLike({ postId, initialLikeCount, userId }: UsePostLikeProps): UsePostLikeReturn {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        // Fetch total like count for this post
        const { count, error: countError } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (countError) throw countError;
        setLikeCount(count || 0);

        // Check if current user has liked this post
        if (userId) {
          const { data, error } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

          if (error) throw error;
          setIsLiked(!!data);
        } else {
          setIsLiked(false);
        }
      } catch (error) {
        console.error('Error fetching like data:', error);
      }
    };

    fetchLikeData();
  }, [postId, userId]);

  const toggleLike = async () => {
    if (!userId || isLoading) return;

    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    try {
      setIsLoading(true);

      if (isLiked) {
        // Optimistically update UI
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));

        // Delete the like from database
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Optimistically update UI
        setIsLiked(true);
        setLikeCount(prev => prev + 1);

        // Insert new like into database
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: userId,
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    likeCount,
    toggleLike,
    isLoading,
  };
}
