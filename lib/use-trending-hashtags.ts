import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useTrendingHashtags(limit: number = 10) {
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendingTags() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('posts')
          .select('hashtags')
          .not('hashtags', 'is', null)
          .limit(1000);

        if (error) {
          throw error;
        }

        const tagCounts: Record<string, number> = {};

        data?.forEach((post) => {
          if (post.hashtags && Array.isArray(post.hashtags)) {
            post.hashtags.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([tag]) => tag);

        setTrendingTags(sorted);
      } catch (err) {
        console.error('Error fetching trending hashtags:', err);
        setTrendingTags([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingTags();
  }, [limit]);

  return { trendingTags, loading };
}
