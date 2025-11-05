'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

type Product = {
  id: string;
  post_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  price: number;
  product_url: string;
  image_url: string | null;
  clicks: number;
  sales: number;
  views: number;
  created_at: string;
};

type ProductWithPost = Product & {
  posts?: {
    id: string;
  };
  mall_affiliates?: {
    network: string;
  };
};

type StoreStats = {
  totalProducts: number;
  totalClicks: number;
  totalSales: number;
};

export default function CreatorStorefront() {
  const params = useParams();
  const username = params.username as string;
  const decodedUsername = username ? decodeURIComponent(username).replace('@', '') : '';
  
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<ProductWithPost[]>([]);
  const [stats, setStats] = useState<StoreStats>({ totalProducts: 0, totalClicks: 0, totalSales: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchStorefront();
  }, [decodedUsername]);

  useEffect(() => {
    if (user && profile) {
      checkFollowStatus();
    }
  }, [user, profile?.id]);

  const fetchStorefront = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('username', decodedUsername)
        .single();

      if (profileError || !profileData) {
        setError('Creator not found');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: productsData, error: productsError } = await supabase
        .from('mall_products')
        .select('*, posts(id), mall_affiliates(network)')
        .eq('creator_id', profileData.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setError('Failed to load products');
        setLoading(false);
        return;
      }

      setProducts(productsData || []);

      const totalProducts = productsData?.length || 0;
      const totalClicks = productsData?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0;
      const totalSales = productsData?.reduce((sum, p) => sum + (p.sales || 0), 0) || 0;

      setStats({ totalProducts, totalClicks, totalSales });
    } catch (err: any) {
      console.error('Error loading storefront:', err);
      setError(err.message || 'Failed to load storefront');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !profile) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single();

    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user || !profile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: profile.id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };


  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        padding: '40px 20px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: 16,
            padding: 40,
            marginBottom: 32,
          }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.1)',
              margin: '0 auto 20px',
            }} />
            <div style={{
              height: 24,
              width: 200,
              background: 'rgba(212, 175, 55, 0.1)',
              margin: '0 auto 12px',
              borderRadius: 4,
            }} />
            <div style={{
              height: 16,
              width: 300,
              background: 'rgba(212, 175, 55, 0.1)',
              margin: '0 auto',
              borderRadius: 4,
            }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(26, 26, 26, 0.6)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  width: '100%',
                  paddingTop: '100%',
                  background: 'rgba(212, 175, 55, 0.1)',
                }} />
                <div style={{ padding: 16 }}>
                  <div style={{
                    height: 20,
                    background: 'rgba(212, 175, 55, 0.1)',
                    marginBottom: 8,
                    borderRadius: 4,
                  }} />
                  <div style={{
                    height: 16,
                    background: 'rgba(212, 175, 55, 0.1)',
                    width: '60%',
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🛍️</div>
          <div style={{
            color: 'var(--text-primary)',
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 12,
          }}>
            {error || 'Storefront not found'}
          </div>
          <Link
            href="/mall"
            style={{
              display: 'inline-block',
              marginTop: 20,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: 8,
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: 'rgba(26, 26, 26, 0.8)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 16,
          padding: 40,
          marginBottom: 32,
          textAlign: 'center',
        }}>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: profile.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
            border: '3px solid rgba(212, 175, 55, 0.5)',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: 'var(--accent-gold)',
          }}>
            {!profile.avatar_url && profile.username.slice(0, 2).toUpperCase()}
          </div>

          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 8,
          }}>
            @{profile.username}
          </h1>

          {profile.bio && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 16,
              marginBottom: 24,
              maxWidth: 600,
              margin: '0 auto 24px',
            }}>
              {profile.bio}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <div>
              <div style={{
                color: 'var(--accent-gold)',
                fontSize: 28,
                fontWeight: 700,
              }}>
                {stats.totalProducts}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}>
                Products
              </div>
            </div>
            <div>
              <div style={{
                color: 'var(--accent-gold)',
                fontSize: 28,
                fontWeight: 700,
              }}>
                {stats.totalClicks}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}>
                Clicks
              </div>
            </div>
            <div>
              <div style={{
                color: 'var(--accent-gold)',
                fontSize: 28,
                fontWeight: 700,
              }}>
                {stats.totalSales}
              </div>
              <div style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}>
                Sales
              </div>
            </div>
          </div>

          {user && user.id !== profile.id && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              style={{
                padding: '12px 32px',
                background: isFollowing
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
                border: `1px solid ${isFollowing ? 'rgba(255, 255, 255, 0.3)' : 'rgba(212, 175, 55, 0.5)'}`,
                borderRadius: 8,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: followLoading ? 'not-allowed' : 'pointer',
                opacity: followLoading ? 0.6 : 1,
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🛍️</div>
            <div style={{
              color: 'var(--text-primary)',
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 8,
            }}>
              No products yet
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: 16,
            }}>
              This creator hasn't listed any products yet.
            </div>
          </div>
        ) : (
          <>
            <h2 style={{
              color: 'var(--text-primary)',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 24,
            }}>
              Products
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: 'rgba(26, 26, 26, 0.6)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                  }}
                >
                  {product.image_url && (
                    <div style={{
                      width: '100%',
                      paddingTop: '100%',
                      background: `url(${product.image_url}) center/cover`,
                      position: 'relative',
                    }} />
                  )}

                  <div style={{ padding: 16 }}>
                    <h3 style={{
                      color: 'var(--text-primary)',
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}>
                      {product.title}
                    </h3>

                    {product.description && (
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: 14,
                        marginBottom: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {product.description}
                      </p>
                    )}

                    <div style={{
                      color: 'var(--accent-gold)',
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 16,
                    }}>
                      ${product.price.toFixed(2)}
                    </div>

                    {product.mall_affiliates && (
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: 'rgba(138, 43, 226, 0.2)',
                        border: '1px solid rgba(138, 43, 226, 0.5)',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'rgba(186, 85, 211, 1)',
                        marginBottom: 12,
                      }}>
                        🔗 Affiliate
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: 8,
                    }}>
                      {product.posts?.id && (
                        <Link
                          href={`/post/${product.post_id}`}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 6,
                            color: 'white',
                            textDecoration: 'none',
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          View Post
                        </Link>
                      )}

                      <a
                        href={`/api/mall/click/${product.id}?ref=storefront`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                          borderRadius: 6,
                          color: 'white',
                          textDecoration: 'none',
                          textAlign: 'center',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Buy Now
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
