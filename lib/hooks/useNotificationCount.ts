import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotificationCount(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('read_at', null);

        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('notification_count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.read_at && !payload.old.read_at) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { unreadCount, loading };
}
