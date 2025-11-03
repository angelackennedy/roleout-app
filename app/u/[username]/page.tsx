'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useFollow } from '@/lib/hooks/useFollow';
import Link from 'next/link';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const username = params.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingConversation, setStartingConversation] = useState(false);

  const { isFollowing, isLoading: followLoading, followersCount, followingCount, toggleFollow } = useFollow({
    targetUserId: profile?.id || null,
    currentUserId: user?.id || null,
  });

  const handleMessage = async () => {
    if (!user || !profile) return;

    setStartingConversation(true);
    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_or_create_conversation', { other_user_id: profile.id });

      if (rpcError) throw rpcError;

      router.push(`/dm/${data}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Failed to start conversation');
    } finally {
      setStartingConversation(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        setError('Profile not found');
      } else if (data) {
        if (user && data.id === user.id) {
          router.push('/profile');
          return;
        }
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>😕</div>
        <div style={{ fontSize: 24, marginBottom: 20 }}>Profile Not Found</div>
        <Link href="/" style={{
          color: 'rgba(212,175,55,0.8)',
          fontSize: 14,
          textDecoration: 'none',
          borderBottom: '1px solid rgba(212,175,55,0.3)',
        }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: 30 }}>
          <Link href="/" style={{
            color: 'rgba(212,175,55,0.8)',
            fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
          }}>
            ← Back to Home
          </Link>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
        }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: profile.avatar_url
                ? `url(${profile.avatar_url}) center/cover`
                : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              border: '3px solid rgba(255,255,255,0.2)',
              margin: '0 auto 24px',
            }}
          >
            {!profile.avatar_url && profile.username.slice(0, 2).toUpperCase()}
          </div>

          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            color: 'white',
          }}>
            {profile.display_name || profile.username}
          </h1>

          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 20,
          }}>
            @{profile.username}
          </p>

          {profile.bio && (
            <p style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
              marginBottom: 24,
              padding: '0 20px',
            }}>
              {profile.bio}
            </p>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 24,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>
                {followersCount}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Followers
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>
                {followingCount}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Following
              </div>
            </div>
          </div>

          {user && user.id !== profile.id && (
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                style={{
                  background: isFollowing
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
                  border: isFollowing ? '2px solid rgba(255,255,255,0.2)' : 'none',
                  borderRadius: 24,
                  padding: '12px 32px',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: followLoading ? 'not-allowed' : 'pointer',
                  opacity: followLoading ? 0.6 : 1,
                }}
              >
                {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>

              <button
                onClick={handleMessage}
                disabled={startingConversation}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(212,175,55,0.3)',
                  borderRadius: 24,
                  padding: '12px 32px',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: startingConversation ? 'not-allowed' : 'pointer',
                  opacity: startingConversation ? 0.6 : 1,
                }}
              >
                {startingConversation ? 'Loading...' : 'Message'}
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}>
            <span>📅</span>
            <span>Joined {joinedDate}</span>
          </div>
        </div>

        <div style={{
          marginTop: 30,
          padding: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
        }}>
          <p>Content and activity from @{profile.username} will appear here soon.</p>
        </div>
      </div>
    </div>
  );
}
