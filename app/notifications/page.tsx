'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/time-utils';

type Notification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow';
  post_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const { data: actorData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', payload.new.actor_id)
            .single();

          if (actorData) {
            const newNotification = {
              ...payload.new,
              actor: actorData,
            } as Notification;

            setNotifications((prev) => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: 'white',
      }}>
        <div style={{ fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor.display_name || notification.actor.username;
    
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`;
      case 'comment':
        return `${actorName} commented on your post`;
      case 'follow':
        return `${actorName} started following you`;
      default:
        return 'New notification';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'follow') {
      return `/u/${notification.actor.username}`;
    }
    if (notification.post_id) {
      return `/`; // Could link to specific post if you have a post detail page
    }
    return '#';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        background: '#000',
        borderBottom: '1px solid #333',
        zIndex: 10,
        padding: '16px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                background: 'rgba(212,175,55,0.2)',
                border: '1px solid rgba(212,175,55,0.5)',
                borderRadius: 6,
                color: 'rgba(212,175,55,0.9)',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
        {unreadCount > 0 && (
          <div style={{ fontSize: 14, color: '#888' }}>
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading notifications...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 40, color: '#ff4444' }}>
            {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            color: '#888',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              No notifications yet
            </div>
            <div style={{ fontSize: 14 }}>
              When someone likes, comments, or follows you, you&apos;ll see it here
            </div>
          </div>
        )}

        {!loading && !error && notifications.map((notification) => {
          const isUnread = !notification.read_at;
          const link = getNotificationLink(notification);

          return (
            <div
              key={notification.id}
              onClick={() => {
                if (isUnread) {
                  markAsRead(notification.id);
                }
              }}
              style={{
                padding: '16px',
                borderBottom: '1px solid #333',
                background: isUnread ? 'rgba(212,175,55,0.05)' : 'transparent',
                borderLeft: isUnread ? '3px solid rgba(212,175,55,0.8)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isUnread
                  ? 'rgba(212,175,55,0.1)'
                  : 'rgba(255,255,255,0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isUnread
                  ? 'rgba(212,175,55,0.05)'
                  : 'transparent';
              }}
            >
              <Link
                href={link}
                style={{
                  display: 'flex',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'white',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: notification.actor.avatar_url
                    ? `url(${notification.actor.avatar_url}) center/cover`
                    : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {!notification.actor.avatar_url &&
                    notification.actor.username.slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 15,
                    lineHeight: 1.4,
                    marginBottom: 4,
                    fontWeight: isUnread ? 600 : 400,
                  }}>
                    {getNotificationText(notification)}
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    {formatRelativeTime(notification.created_at)}
                  </div>
                </div>

                <div style={{
                  fontSize: 24,
                  flexShrink: 0,
                  opacity: 0.5,
                }}>
                  {notification.type === 'like' && '❤️'}
                  {notification.type === 'comment' && '💬'}
                  {notification.type === 'follow' && '👤'}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
