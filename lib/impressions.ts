import { supabase } from './supabase';

export interface ImpressionData {
  postId: string;
  userId: string;
  msWatched: number;
}

export async function trackImpression(data: ImpressionData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('post_impressions')
      .insert({
        post_id: data.postId,
        user_id: data.userId,
        ms_watched: data.msWatched,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error tracking impression:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to track impression:', err);
    return false;
  }
}

export function shouldTrackImpression(
  postId: string,
  trackedPosts: Set<string>
): boolean {
  return !trackedPosts.has(postId);
}
