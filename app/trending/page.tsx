'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useFollow } from '@/lib/hooks/useFollow';
import Link from 'next/link';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

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

// Extended type to include counts from likes/comments tables
type PostWithCounts = Post & {
  like_count: number;
  comment_count: number;
};

function TrendingPostCard({ 
  post, 
  rank, 
  currentUserId 
}: { 
  post: PostWithCounts; 
  rank: number;
  currentUserId: string | null;
}) {
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
      position: 'relative',
      transition: 'all 0.2s',
    }}>
      {/* Rank Badge */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: rank <= 3 
          ? 'linear-gradient(135deg, rgba(212,175,55,0.9) 0%, rgba(212,175,55,0.7) 100%)'
          : 'rgba(0,0,0,0.7)',
        border: '2px solid rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 700,
        color: 'white',
        zIndex: 10,
        backdropFilter: 'blur(10px)',
      }}>
        #{rank}
      </div>

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
        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18 }}>❤️</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
              {post.like_count.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
              {post.comment_count.toLocaleString()}
            </span>
          </div>
        </div>

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

export default function TrendingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTrendingPosts();
    }
  }, [user]);

  const fetchTrendingPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, get all posts with valid video_url
      const { data: postsData, error: postsError } = await supabase
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
        .limit(200); // Get more than 50 to account for filtering

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        setError(`Failed to load posts: ${postsError.message}`);
        setPosts([]);
        setLoading(false);
        return;
      }

      // For each post, count likes and comments
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Count likes
          const { count: likeCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Count comments
          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            ...post,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
          } as PostWithCounts;
        })
      );

      // Sort by engagement (likes + comments), then by created_at
      const sortedPosts = postsWithCounts.sort((a, b) => {
        const engagementA = a.like_count + a.comment_count;
        const engagementB = b.like_count + b.comment_count;
        
        if (engagementB !== engagementA) {
          return engagementB - engagementA; // Higher engagement first
        }
        
        // If engagement is equal, sort by newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Take top 50
      setPosts(sortedPosts.slice(0, 50));
    } catch (err: any) {
      console.error('Error fetching trending posts:', err);
      setError(err?.message || 'Failed to load trending posts');
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
          marginBottom: 8,
        }}>
          🔥 Trending Now
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 24,
        }}>
          Most popular videos ranked by likes and comments
        </p>

        {loading ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Loading trending posts...
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
          <div style={{
            padding: 60,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
            <div style={{ fontSize: 20, marginBottom: 10 }}>No trending posts yet</div>
            <div style={{ fontSize: 14 }}>Check back soon!</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {posts.map((post, index) => (
              <TrendingPostCard 
                key={post.id} 
                post={post} 
                rank={index + 1}
                currentUserId={user?.id || null} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
