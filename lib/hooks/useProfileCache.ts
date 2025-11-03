import { useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

// Session-scoped in-memory cache
const profileCache = new Map<string, Profile>();
const cacheTimestamps = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useProfileCache() {
  const fetchingRef = useRef<Set<string>>(new Set());

  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Check if profile is in cache and not expired
    const cached = profileCache.get(userId);
    const timestamp = cacheTimestamps.get(userId);
    
    if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
      return cached;
    }

    // Prevent duplicate fetches for the same user
    if (fetchingRef.current.has(userId)) {
      // Wait for ongoing fetch
      await new Promise(resolve => setTimeout(resolve, 100));
      return profileCache.get(userId) || null;
    }

    try {
      fetchingRef.current.add(userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        profileCache.set(userId, data);
        cacheTimestamps.set(userId, Date.now());
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    } finally {
      fetchingRef.current.delete(userId);
    }
  }, []);

  const getProfileByUsername = useCallback(async (username: string): Promise<Profile | null> => {
    // Check cache by username
    for (const [userId, profile] of profileCache.entries()) {
      if (profile.username === username) {
        const timestamp = cacheTimestamps.get(userId);
        if (timestamp && Date.now() - timestamp < CACHE_TTL) {
          return profile;
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('username', username)
        .single();

      if (error) throw error;

      if (data) {
        profileCache.set(data.id, data);
        cacheTimestamps.set(data.id, Date.now());
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
  }, []);

  const preloadProfiles = useCallback(async (userIds: string[]) => {
    const uncachedIds = userIds.filter(id => {
      const cached = profileCache.get(id);
      const timestamp = cacheTimestamps.get(id);
      return !cached || !timestamp || Date.now() - timestamp >= CACHE_TTL;
    });

    if (uncachedIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', uncachedIds);

      if (error) throw error;

      if (data) {
        data.forEach(profile => {
          profileCache.set(profile.id, profile);
          cacheTimestamps.set(profile.id, Date.now());
        });
      }
    } catch (error) {
      console.error('Error preloading profiles:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    profileCache.clear();
    cacheTimestamps.clear();
  }, []);

  return {
    getProfile,
    getProfileByUsername,
    preloadProfiles,
    clearCache,
  };
}
