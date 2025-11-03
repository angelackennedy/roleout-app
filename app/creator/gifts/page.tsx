'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Link from 'next/link';

interface Gift {
  id: string;
  emoji: string;
  name: string;
  coins: number;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ReceivedGift {
  gift_type: string;
  count: number;
  total_coins: number;
  sender_username?: string;
  created_at: string;
}

// Virtual gifts catalog with emojis and coin values
const GIFT_CATALOG: Gift[] = [
  {
    id: 'rose',
    emoji: '🌹',
    name: 'Rose',
    coins: 10,
    description: 'A beautiful rose',
    rarity: 'common',
  },
  {
    id: 'heart',
    emoji: '❤️',
    name: 'Heart',
    coins: 25,
    description: 'Send some love',
    rarity: 'common',
  },
  {
    id: 'star',
    emoji: '⭐',
    name: 'Star',
    coins: 50,
    description: 'You are a star!',
    rarity: 'common',
  },
  {
    id: 'fire',
    emoji: '🔥',
    name: 'Fire',
    coins: 75,
    description: 'This content is fire!',
    rarity: 'rare',
  },
  {
    id: 'diamond',
    emoji: '💎',
    name: 'Diamond',
    coins: 100,
    description: 'Rare and precious',
    rarity: 'rare',
  },
  {
    id: 'crown',
    emoji: '👑',
    name: 'Crown',
    coins: 200,
    description: 'Royal recognition',
    rarity: 'epic',
  },
  {
    id: 'trophy',
    emoji: '🏆',
    name: 'Trophy',
    coins: 300,
    description: 'Champion status',
    rarity: 'epic',
  },
  {
    id: 'rocket',
    emoji: '🚀',
    name: 'Rocket',
    coins: 500,
    description: 'To the moon!',
    rarity: 'legendary',
  },
  {
    id: 'galaxy',
    emoji: '🌌',
    name: 'Galaxy',
    coins: 1000,
    description: 'Out of this world',
    rarity: 'legendary',
  },
  {
    id: 'unicorn',
    emoji: '🦄',
    name: 'Unicorn',
    coins: 2500,
    description: 'Magical and unique',
    rarity: 'legendary',
  },
];

export default function CreatorGiftsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'received'>('catalog');
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'received') {
      fetchReceivedGifts();
    }
  }, [user, activeTab]);

  const fetchReceivedGifts = async () => {
    setLoading(true);
    try {
      // Mock data for now - in production, fetch from gifts table
      const mockReceivedGifts: ReceivedGift[] = [
        { gift_type: 'diamond', count: 12, total_coins: 1200, sender_username: 'fan123', created_at: new Date().toISOString() },
        { gift_type: 'rose', count: 45, total_coins: 450, sender_username: 'supporter99', created_at: new Date().toISOString() },
        { gift_type: 'rocket', count: 3, total_coins: 1500, sender_username: 'megafan', created_at: new Date().toISOString() },
        { gift_type: 'heart', count: 28, total_coins: 700, sender_username: 'viewer42', created_at: new Date().toISOString() },
        { gift_type: 'crown', count: 5, total_coins: 1000, sender_username: 'vip_user', created_at: new Date().toISOString() },
      ];
      
      setReceivedGifts(mockReceivedGifts);
      setTotalCoinsEarned(mockReceivedGifts.reduce((sum, g) => sum + g.total_coins, 0));
    } catch (error) {
      console.error('Error fetching received gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'rgba(150,150,150,0.8)';
      case 'rare': return 'rgba(100,150,255,0.8)';
      case 'epic': return 'rgba(200,100,255,0.8)';
      case 'legendary': return 'rgba(255,200,50,0.9)';
      default: return 'rgba(255,255,255,0.6)';
    }
  };

  const getGiftEmoji = (giftType: string): string => {
    const gift = GIFT_CATALOG.find(g => g.id === giftType);
    return gift?.emoji || '🎁';
  };

  const getGiftName = (giftType: string): string => {
    const gift = GIFT_CATALOG.find(g => g.id === giftType);
    return gift?.name || giftType;
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Header />
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          color: 'rgba(255,255,255,0.7)',
        }}>
          Please log in to view virtual gifts.
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Header />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>
            🎁 Virtual Gifts
          </h1>
          <p style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
          }}>
            Browse gift catalog and track gifts received from your audience
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          padding: 16,
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 12,
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 14,
            color: 'rgba(212,175,55,0.9)',
            lineHeight: 1.6,
          }}>
            <strong>Total Coins Earned:</strong> {totalCoinsEarned.toLocaleString()} coins
            <br />
            <small style={{ color: 'rgba(212,175,55,0.7)' }}>
              Fans can send virtual gifts during live streams or on your posts
            </small>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'catalog' ? 'rgba(212,175,55,0.9)' : 'transparent'}`,
              color: activeTab === 'catalog' ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.6)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Gift Catalog
          </button>
          <button
            onClick={() => setActiveTab('received')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'received' ? 'rgba(212,175,55,0.9)' : 'transparent'}`,
              color: activeTab === 'received' ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.6)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Received Gifts
          </button>
        </div>

        {/* Content */}
        {activeTab === 'catalog' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {GIFT_CATALOG.map((gift) => (
              <div
                key={gift.id}
                style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${getRarityColor(gift.rarity)}`,
                  borderRadius: 16,
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 16px ${getRarityColor(gift.rarity)}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: 48,
                  marginBottom: 12,
                }}>
                  {gift.emoji}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}>
                  {gift.name}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 12,
                }}>
                  {gift.description}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  background: getRarityColor(gift.rarity) + '22',
                  border: `1px solid ${getRarityColor(gift.rarity)}`,
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: getRarityColor(gift.rarity),
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {gift.rarity}
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'rgba(212,175,55,0.9)',
                }}>
                  {gift.coins} coins
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {loading ? (
              <div style={{
                padding: 40,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
              }}>
                Loading received gifts...
              </div>
            ) : receivedGifts.length === 0 ? (
              <div style={{
                padding: 40,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
              }}>
                No gifts received yet. Start creating content to receive gifts from your fans!
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: 12,
              }}>
                {receivedGifts.map((receivedGift, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 20,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div style={{
                      fontSize: 40,
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(212,175,55,0.1)',
                      borderRadius: 12,
                    }}>
                      {getGiftEmoji(receivedGift.gift_type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                      }}>
                        {getGiftName(receivedGift.gift_type)}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                        Received {receivedGift.count} times
                        {receivedGift.sender_username && ` • Latest from @${receivedGift.sender_username}`}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                    }}>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'rgba(212,175,55,0.9)',
                      }}>
                        {receivedGift.total_coins.toLocaleString()}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        coins
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Integration Notice */}
        <div style={{
          marginTop: 32,
          padding: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 12,
          }}>
            💳 Payment integration and coin redemption coming soon
          </div>
          <Link
            href="/creator"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 8,
              color: 'rgba(212,175,55,0.9)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            ← Back to Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
