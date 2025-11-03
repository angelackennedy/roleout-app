import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseFollowProps {
  targetUserId: string | null;
  currentUserId: string | null;
}

interface UseFollowReturn {
  isFollowing: boolean;
  isLoading: boolean;
  followersCount: number;
  followingCount: number;
  toggleFollow: () => Promise<void>;
}

export function useFollow({ targetUserId, currentUserId }: UseFollowProps): UseFollowReturn {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Check if current user follows target user
  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setIsFollowing(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
          .maybeSingle();

        if (error) throw error;
        setIsFollowing(!!data);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [currentUserId, targetUserId]);

  // Fetch followers and following counts
  useEffect(() => {
    if (!targetUserId) return;

    const fetchCounts = async () => {
      try {
        // Count followers (people who follow this user)
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetUserId);

        // Count following (people this user follows)
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId);

        setFollowersCount(followers || 0);
        setFollowingCount(following || 0);
      } catch (error) {
        console.error('Error fetching follow counts:', error);
      }
    };

    fetchCounts();
  }, [targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId || isLoading || currentUserId === targetUserId) {
      return;
    }

    const previousIsFollowing = isFollowing;
    const previousFollowersCount = followersCount;

    try {
      setIsLoading(true);

      if (isFollowing) {
        // Optimistic update
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));

        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;
      } else {
        // Optimistic update
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);

        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      // Rollback on error
      setIsFollowing(previousIsFollowing);
      setFollowersCount(previousFollowersCount);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing, followersCount, isLoading]);

  return {
    isFollowing,
    isLoading,
    followersCount,
    followingCount,
    toggleFollow,
  };
}
