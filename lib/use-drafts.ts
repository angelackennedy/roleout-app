import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface Draft {
  id: string;
  user_id: string;
  video_url: string | null;
  cover_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useDrafts(userId: string | undefined) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!userId) {
      setDrafts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setDrafts(data || []);
    } catch (err: any) {
      console.error('Error fetching drafts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createDraft = useCallback(async (draftData: Partial<Draft>) => {
    if (!userId) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('post_drafts')
        .insert({
          user_id: userId,
          ...draftData,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setDrafts((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error creating draft:', err);
      setError(err.message);
      return null;
    }
  }, [userId]);

  const updateDraft = useCallback(async (draftId: string, updates: Partial<Draft>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('post_drafts')
        .update(updates)
        .eq('id', draftId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setDrafts((prev) =>
        prev.map((draft) => (draft.id === draftId ? data : draft))
      );

      return data;
    } catch (err: any) {
      console.error('Error updating draft:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('post_drafts')
        .delete()
        .eq('id', draftId);

      if (deleteError) {
        throw deleteError;
      }

      setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
      return true;
    } catch (err: any) {
      console.error('Error deleting draft:', err);
      setError(err.message);
      return false;
    }
  }, []);

  return {
    drafts,
    loading,
    error,
    createDraft,
    updateDraft,
    deleteDraft,
    refetch: fetchDrafts,
  };
}
