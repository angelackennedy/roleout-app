'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useFollow } from '@/lib/hooks/useFollow';
import Link from 'next/link';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState';

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type Post = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
  profiles: Profile;
};

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string | null }) {
  const { isFollowing, toggleFollow, isLoading } = useFollow({
    targetUserId: post.user_id,
    currentUserId,
  });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      <Link href={`/post/${post.id}`} style={{ textDecoration: 'none' }}>
        <video
          src={post.video_url}
          style={{
            width: '100%',
            aspectRatio: '9/16',
            objectFit: 'cover',
            background: '#000',
          }}
          muted
          loop
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => e.currentTarget.pause()}
        />
      </Link>

      <div style={{ padding: 16 }}>
        <Link
          href={`/u/${post.profiles.username}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: post.profiles.avatar_url
              ? `url(${post.profiles.avatar_url}) center/cover`
              : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
          }}>
            {!post.profiles.avatar_url && post.profiles.username.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'white',
            }}>
              @{post.profiles.username}
            </div>
          </div>
        </Link>

        {post.caption && (
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.4,
            marginBottom: 12,
          }}>
            {post.caption.length > 100 ? post.caption.substring(0, 100) + '...' : post.caption}
          </div>
        )}

        {currentUserId && currentUserId !== post.user_id && (
          <button
            onClick={toggleFollow}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 20px',
              background: isFollowing
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
              border: isFollowing ? '2px solid rgba(255,255,255,0.2)' : 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .not('video_url', 'is', null)
        .neq('video_url', '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching posts:', fetchError);
        setError(`Failed to load posts: ${fetchError.message}`);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err?.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Header />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 24,
        }}>
          🔍 Discover Latest Videos
        </h1>

        {loading ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Loading latest posts...
          </div>
        ) : error ? (
          <div style={{
            padding: 20,
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: 8,
            color: '#ff6b6b',
            textAlign: 'center',
          }}>
            {error}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState 
            icon="📹"
            title="No posts to discover yet"
            description="This feed shows the latest videos from the community. Check back soon for fresh content, or upload your own video to get started!"
            actions={[
              { label: 'Upload Your First Video', href: '/upload', primary: true },
              { label: 'Browse Trending', href: '/trending' },
            ]}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id || null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
