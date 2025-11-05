'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import VideoPost from '@/components/VideoPost';
import Link from 'next/link';

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
  view_count: number;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export default function TagPage() {
  const { user } = useAuth();
  const params = useParams();
  const tagName = params.name as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const POSTS_PER_PAGE = 5;

  const fetchPosts = async (pageNum: number) => {
    try {
      const { data, error } = await supabase.rpc('get_posts_by_hashtag', {
        tag_name: tagName,
        result_limit: POSTS_PER_PAGE,
        result_offset: pageNum * POSTS_PER_PAGE,
        current_user_id: user?.id || null,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setPosts((prev) => (pageNum === 0 ? data : [...prev, ...data]));
        setHasMore(data.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
        if (pageNum === 0) {
          setPosts([]);
        }
      }
    } catch (err) {
      console.error('Error fetching posts by hashtag:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, [tagName]);

  useEffect(() => {
    if (page > 0) {
      fetchPosts(page);
    }
  }, [page]);

  useEffect(() => {
    if (posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setCurrentIndex(index);

            if (index >= posts.length - 2 && hasMore && !loading) {
              setPage((prev) => prev + 1);
            }
          }
        });
      },
      { threshold: 0.7 }
    );

    const postElements = containerRef.current?.querySelectorAll('[data-index]');
    postElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [posts, hasMore, loading]);

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
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            #{tagName}
          </div>
          <div style={{ fontSize: 16, color: '#888' }}>Loading posts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#ff4444',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchPosts(0);
            }}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
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
        padding: 24,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
          #{tagName}
        </div>
        <div style={{ fontSize: 16, color: '#888', textAlign: 'center', maxWidth: 400 }}>
          No posts found with this hashtag yet. Be the first to create content with #{tagName}!
        </div>
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
        background: '#000',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link 
            href="/"
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: 'white',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Home
          </Link>
          <h1 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: 0,
            color: 'white',
          }}>
            #{tagName}
          </h1>
        </div>
      </div>

      {posts.map((post, index) => (
        <div
          key={post.id}
          data-index={index}
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
            position: 'relative',
          }}
        >
          <VideoPost
            post={post}
            isActive={index === currentIndex}
            userId={user?.id || null}
          />
        </div>
      ))}

      {loading && posts.length > 0 && (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}>
          <div style={{ fontSize: 18 }}>Loading more posts...</div>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
        }}>
          <div style={{ fontSize: 18 }}>You&apos;ve reached the end!</div>
        </div>
      )}
    </div>
  );
}
