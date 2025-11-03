'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useDebouncedSearch } from '@/lib/hooks/useDebounce';

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
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

type Hashtag = {
  tag: string;
  post_count: number;
};

type TabType = 'top' | 'users' | 'tags';

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('top');
  const { searchQuery, setSearchQuery, debouncedSearchQuery, isSearching } = useDebouncedSearch('', 300);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const searchPosts = async (query: string) => {
    if (!query.trim()) {
      setPosts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('search_posts', {
        search_query: query,
        result_limit: 50,
        result_offset: 0,
        current_user_id: user?.id || null,
      });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error searching posts:', err);
      setError('Failed to search posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_query: query,
        result_limit: 50,
        result_offset: 0,
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingHashtags = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_trending_hashtags', {
        result_limit: 50,
      });

      if (error) throw error;
      setHashtags(data || []);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
      setError('Failed to load trending hashtags');
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tags' && hashtags.length === 0) {
      loadTrendingHashtags();
    }
  }, [activeTab]);

  // Use debounced search query to reduce API calls
  useEffect(() => {
    if (activeTab === 'top') {
      searchPosts(debouncedSearchQuery);
    } else if (activeTab === 'users') {
      searchUsers(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, activeTab]);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: 'white' }}>
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        background: '#000', 
        borderBottom: '1px solid #333',
        zIndex: 10,
        padding: '16px'
      }}>
        <input
          type="text"
          placeholder="Search posts, users, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            color: 'white',
            outline: 'none',
          }}
        />

        <div style={{ 
          display: 'flex', 
          gap: 24, 
          marginTop: 16,
          borderBottom: '1px solid #333'
        }}>
          <button
            onClick={() => setActiveTab('top')}
            style={{
              padding: '12px 0',
              fontSize: 15,
              fontWeight: activeTab === 'top' ? 600 : 400,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'top' ? '2px solid #fff' : '2px solid transparent',
              color: activeTab === 'top' ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >
            Top
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 0',
              fontSize: 15,
              fontWeight: activeTab === 'users' ? 600 : 400,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '2px solid #fff' : '2px solid transparent',
              color: activeTab === 'users' ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            style={{
              padding: '12px 0',
              fontSize: 15,
              fontWeight: activeTab === 'tags' ? 600 : 400,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tags' ? '2px solid #fff' : '2px solid transparent',
              color: activeTab === 'tags' ? '#fff' : '#888',
              cursor: 'pointer',
            }}
          >
            Tags
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            Loading...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 40, color: '#ff4444' }}>
            {error}
          </div>
        )}

        {!loading && !error && activeTab === 'top' && (
          <div>
            {posts.length === 0 && searchQuery && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                No posts found for &quot;{searchQuery}&quot;
              </div>
            )}
            {posts.length === 0 && !searchQuery && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                Search for posts by caption or hashtag
              </div>
            )}
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  borderBottom: '1px solid #333',
                  padding: '16px 0',
                }}
              >
                <Link
                  href={`/u/${post.username}`}
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
                    background: '#333',
                    overflow: 'hidden',
                  }}>
                    {post.avatar_url && (
                      <img
                        src={post.avatar_url}
                        alt={post.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{post.display_name}</div>
                    <div style={{ fontSize: 14, color: '#888' }}>@{post.username}</div>
                  </div>
                </Link>

                {post.caption && (
                  <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    {post.caption}
                  </p>
                )}

                {post.hashtags && post.hashtags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {post.hashtags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/tag/${tag}`}
                        style={{
                          fontSize: 14,
                          color: '#1d9bf0',
                          textDecoration: 'none',
                        }}
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#888' }}>
                  <span>❤️ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && activeTab === 'users' && (
          <div>
            {users.length === 0 && searchQuery && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                No users found for &quot;{searchQuery}&quot;
              </div>
            )}
            {users.length === 0 && !searchQuery && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                Search for users by username or display name
              </div>
            )}
            {users.map((profile) => (
              <Link
                key={profile.id}
                href={`/u/${profile.username}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 0',
                  borderBottom: '1px solid #333',
                  textDecoration: 'none',
                  color: 'white',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#333',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {profile.avatar_url && (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{profile.display_name}</div>
                  <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                    @{profile.username}
                  </div>
                  {profile.bio && (
                    <div style={{ fontSize: 14, color: '#ccc' }}>
                      {profile.bio}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && activeTab === 'tags' && (
          <div>
            {hashtags.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                No trending hashtags found
              </div>
            )}
            {hashtags.map((hashtag) => (
              <Link
                key={hashtag.tag}
                href={`/tag/${hashtag.tag}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #333',
                  textDecoration: 'none',
                  color: 'white',
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    #{hashtag.tag}
                  </div>
                  <div style={{ fontSize: 14, color: '#888' }}>
                    {hashtag.post_count} {hashtag.post_count === 1 ? 'post' : 'posts'}
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>→</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
