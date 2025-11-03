'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/time-utils';
import { useAuth } from '@/lib/auth-context';
import { usePostLike } from '@/lib/hooks/usePostLike';
import { CommentsDrawer } from '@/components/CommentsDrawer';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  user_id: string;
  video_url: string;
  cover_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  profiles: Profile;
};

function VideoPost({ post, isVisible, userId }: { post: Post; isVisible: boolean; userId: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { isLiked, likeCount, toggleLike, isLoading } = usePostLike({
    postId: post.id,
    initialLikeCount: post.like_count,
    userId,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible]);

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100%',
      scrollSnapAlign: 'start',
      background: '#000',
    }}>
      <video
        ref={videoRef}
        src={post.video_url}
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }}>
        <Link
          href={`/u/${post.profiles.username}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            textDecoration: 'none',
            color: 'white',
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: post.profiles.avatar_url
              ? `url(${post.profiles.avatar_url}) center/cover`
              : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
          }}>
            {!post.profiles.avatar_url && post.profiles.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {post.profiles.display_name || post.profiles.username}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              @{post.profiles.username}
            </div>
          </div>
        </Link>

        {post.caption && (
          <div style={{
            fontSize: 14,
            lineHeight: 1.4,
            marginBottom: 8,
            color: 'white',
          }}>
            {post.caption}
          </div>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}>
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 13,
                  color: 'rgba(212,175,55,0.9)',
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        right: 16,
        bottom: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <button 
          onClick={toggleLike}
          disabled={isLoading}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid white',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            flexDirection: 'column',
            opacity: isLoading ? 0.6 : 1,
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => {
            if (!isLoading) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)';
            }
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: 'white' }}>
            {likeCount}
          </span>
        </button>

        <button 
          onClick={() => setCommentsOpen(true)}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '2px solid white',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: 'pointer',
            flexDirection: 'column',
          }}
        >
          <span>💬</span>
          <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: 'white' }}>
            {post.comment_count}
          </span>
        </button>

        <button style={{
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid white',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          cursor: 'pointer',
          flexDirection: 'column',
        }}>
          <span>↗️</span>
          <span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
            {post.share_count}
          </span>
        </button>
      </div>

      <Link
        href="/upload"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(212,175,55,0.8)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: 30,
          padding: '10px 20px',
          color: 'white',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 18 }}>+</span>
        Upload
      </Link>

      <CommentsDrawer
        postId={post.id}
        userId={userId}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
}

export default function FollowingFeed() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const POSTS_PER_PAGE = 5;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchPosts = async (pageNum: number) => {
    if (!user) return;

    setLoading(true);
    try {
      const from = pageNum * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Get list of users current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followingIds = followingData?.map((f) => f.following_id) || [];

      if (followingIds.length === 0) {
        setPosts([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Fetch posts from followed users
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        setPosts((prev) => pageNum === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts(0);
    }
  }, [user]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;

      const newIndex = Math.round(scrollPosition / containerHeight);
      setCurrentIndex(newIndex);

      if (scrollPosition + containerHeight >= scrollHeight - 200 && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    const videos = document.querySelectorAll('video');
    videos.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [posts]);

  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
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

  if (loading && posts.length === 0) {
    return (
      <div style={{
        height: '100vh',
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

  if (error && posts.length === 0) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: 'white',
        padding: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>😕</div>
        <div style={{ fontSize: 18, marginBottom: 20 }}>Failed to load posts</div>
        <Link
          href="/"
          style={{
            background: 'rgba(212,175,55,0.8)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '12px 24px',
            color: 'white',
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Go to For You feed
        </Link>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: 'white',
        padding: 20,
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>👥</div>
        <div style={{ fontSize: 24, marginBottom: 8, fontWeight: 600 }}>No posts yet</div>
        <div style={{ fontSize: 16, marginBottom: 30, opacity: 0.8 }}>
          Follow some users to see their posts here!
        </div>
        <Link
          href="/"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '14px 28px',
            color: 'white',
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Explore For You feed
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
      }}
    >
      {posts.map((post, index) => (
        <VideoPost
          key={post.id}
          post={post}
          isVisible={index === currentIndex}
          userId={user?.id || null}
        />
      ))}

      {hasMore && (
        <div style={{
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: 'white',
        }}>
          Loading more...
        </div>
      )}
    </div>
  );
}
