import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FairScoreData {
  id: string;
  fair_score: number;
  likes: number;
  comments: number;
  impressions: number;
  watch_completion: number;
}

export function useFairScores(postIds: string[]) {
  const [fairScores, setFairScores] = useState<Map<string, FairScoreData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postIds.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchFairScores() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('post_metrics')
          .select('id, fair_score, likes, comments, impressions, watch_completion')
          .in('id', postIds);

        if (error) throw error;

        const scoresMap = new Map<string, FairScoreData>();
        data?.forEach((item) => {
          scoresMap.set(item.id, item);
        });

        setFairScores(scoresMap);
      } catch (error) {
        console.error('Error fetching fair scores:', error);
        setFairScores(new Map());
      } finally {
        setLoading(false);
      }
    }

    fetchFairScores();
  }, [postIds.join(',')]);

  return { fairScores, loading };
}
