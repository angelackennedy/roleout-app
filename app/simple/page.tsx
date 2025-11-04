'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Link from 'next/link';

type SimplePost = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
};

export default function SimplePage() {
  const [posts, setPosts] = useState<SimplePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('id, user_id, video_url, caption, created_at')
        .not('video_url', 'is', null)
        .neq('video_url', '')
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) {
        throw fetchError;
      }

      setPosts(data || []);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Header />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>
            📹 Simple Video Feed
          </h1>
          <p style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
          }}>
            All posts from the database (posts table)
          </p>
        </div>

        {loading ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Loading posts...
          </div>
        ) : error ? (
          <div style={{
            padding: 20,
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: 12,
            color: '#ff6b6b',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <div style={{ fontSize: 18, marginBottom: 12 }}>{error}</div>
            <Link
              href="/upload"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'rgba(212,175,55,0.8)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                color: 'white',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              Upload a video
            </Link>
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            padding: 60,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📹</div>
            <div style={{ fontSize: 24, marginBottom: 12, color: 'var(--text-primary)' }}>
              No posts yet
            </div>
            <div style={{ fontSize: 16, marginBottom: 30 }}>
              Be the first to upload a video!
            </div>
            <Link
              href="/upload"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                color: 'white',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Upload a video
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,175,55,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                {/* Video */}
                <div style={{
                  width: '100%',
                  aspectRatio: '9/16',
                  background: '#000',
                  position: 'relative',
                }}>
                  <video
                    src={post.video_url}
                    controls
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: 16 }}>
                  {post.caption ? (
                    <div style={{
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      marginBottom: 12,
                      lineHeight: 1.4,
                    }}>
                      {post.caption}
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.4)',
                      marginBottom: 12,
                      fontStyle: 'italic',
                    }}>
                      No caption
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    <div>
                      ID: {post.id.substring(0, 8)}...
                    </div>
                    <div>
                      {formatDate(post.created_at)}
                    </div>
                  </div>

                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <a
                      href={post.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: 'rgba(212,175,55,0.9)',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                      }}
                    >
                      🔗 {post.video_url.substring(0, 50)}...
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {posts.length > 0 && (
          <div style={{
            marginTop: 40,
            padding: 20,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
          }}>
            Showing {posts.length} post{posts.length !== 1 ? 's' : ''} from the posts table
          </div>
        )}
      </div>
    </div>
  );
}
