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
    if (!userId) {
      setIsLiked(false);
      return;
    }

    const checkIfLiked = async () => {
      try {
        const { data, error } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        setIsLiked(!!data);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkIfLiked();
  }, [postId, userId]);

  const toggleLike = async () => {
    if (!userId || isLoading) return;

    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    try {
      setIsLoading(true);

      if (isLiked) {
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));

        const { data, error } = await supabase.rpc('unlike_post', {
          p_post_id: postId,
          p_user_id: userId,
        });

        if (error) throw error;

        if (data && typeof data.like_count === 'number') {
          setLikeCount(data.like_count);
        }
      } else {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);

        const { data, error } = await supabase.rpc('like_post', {
          p_post_id: postId,
          p_user_id: userId,
        });

        if (error) throw error;

        if (data && typeof data.like_count === 'number') {
          setLikeCount(data.like_count);
        }
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
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
