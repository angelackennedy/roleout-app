'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import Header from '@/components/Header';

interface TrendingHashtag {
  tag: string;
  post_count: number;
}

interface RisingCreator {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  new_followers: number;
}

interface TrendingSound {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
  usage_count: number;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'24h' | '7d'>('7d');
  const [activeTab, setActiveTab] = useState<'hashtags' | 'creators' | 'sounds'>('hashtags');
  
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [creators, setCreators] = useState<RisingCreator[]>([]);
  const [sounds, setSounds] = useState<TrendingSound[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [period, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'hashtags') {
        const res = await fetch(`/api/discover/trending-hashtags?period=${period}`);
        const json = await res.json();
        setHashtags(json.data || []);
      } else if (activeTab === 'creators') {
        const res = await fetch(`/api/discover/rising-creators?period=${period}`);
        const json = await res.json();
        setCreators(json.data || []);
      } else if (activeTab === 'sounds') {
        const res = await fetch(`/api/discover/trending-sounds?period=${period}`);
        const json = await res.json();
        setSounds(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching discover data:', err);
      setError('Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Header />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 24,
        }}>
          🔥 Discover
        </h1>

        {/* Time Period Selector */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
        }}>
          <button
            onClick={() => setPeriod('24h')}
            style={{
              padding: '8px 20px',
              background: period === '24h' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${period === '24h' ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20,
              color: period === '24h' ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => setPeriod('7d')}
            style={{
              padding: '8px 20px',
              background: period === '7d' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${period === '7d' ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 20,
              color: period === '7d' ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.7)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Last 7 Days
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {(['hashtags', 'creators', 'sounds'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'rgba(212,175,55,0.9)' : 'transparent'}`,
                color: activeTab === tab ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.6)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'hashtags' ? '# Hashtags' : tab === 'creators' ? '👤 Creators' : '🎵 Sounds'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{
            padding: 20,
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: 8,
            color: '#ff6b6b',
          }}>
            {error}
          </div>
        ) : (
          <div>
            {/* Hashtags Tab */}
            {activeTab === 'hashtags' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}>
                {hashtags.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.5)', padding: 20 }}>
                    No trending hashtags found
                  </div>
                ) : (
                  hashtags.map((item, index) => (
                    <Link
                      key={item.tag}
                      href={`/tag/${encodeURIComponent(item.tag.replace('#', ''))}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        padding: 20,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                          <span style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: 'rgba(212,175,55,0.9)',
                          }}>
                            #{index + 1}
                          </span>
                          <span style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.5)',
                          }}>
                            {item.post_count} posts
                          </span>
                        </div>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}>
                          {item.tag}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Creators Tab */}
            {activeTab === 'creators' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}>
                {creators.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.5)', padding: 20 }}>
                    No rising creators found
                  </div>
                ) : (
                  creators.map((creator, index) => (
                    <Link
                      key={creator.user_id}
                      href={`/u/${creator.username}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        padding: 20,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'rgba(212,175,55,0.9)',
                          }}>
                            #{index + 1}
                          </div>
                          {creator.avatar_url ? (
                            <img
                              src={creator.avatar_url}
                              alt={creator.username}
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'rgba(212,175,55,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                            }}>
                              👤
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              marginBottom: 4,
                            }}>
                              @{creator.username}
                            </div>
                            <div style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.5)',
                            }}>
                              +{creator.new_followers} new followers
                            </div>
                          </div>
                        </div>
                        {creator.bio && (
                          <div style={{
                            marginTop: 12,
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.7)',
                            lineHeight: 1.4,
                          }}>
                            {creator.bio.length > 80 ? creator.bio.substring(0, 80) + '...' : creator.bio}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Sounds Tab */}
            {activeTab === 'sounds' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
              }}>
                {sounds.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.5)', padding: 20 }}>
                    No trending sounds found
                  </div>
                ) : (
                  sounds.map((sound, index) => (
                    <div
                      key={sound.id}
                      style={{
                        padding: 20,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'rgba(212,175,55,0.9)',
                        }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}>
                            {sound.title}
                          </div>
                          {sound.artist && (
                            <div style={{
                              fontSize: 13,
                              color: 'rgba(255,255,255,0.6)',
                            }}>
                              {sound.artist}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: 12,
                      }}>
                        Used in {sound.usage_count} posts
                      </div>
                      <audio
                        controls
                        src={sound.file_url}
                        style={{
                          width: '100%',
                          height: 32,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
