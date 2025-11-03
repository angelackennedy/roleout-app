'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Link from 'next/link';

interface ViewStats {
  total_views: number;
  today_views: number;
  this_week_views: number;
  this_month_views: number;
}

export default function CreatorFundPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // RPM (Revenue Per Mille/Thousand views) - adjustable variable
  const RPM = 2.50; // $2.50 per 1000 views

  useEffect(() => {
    if (user) {
      fetchViewStats();
    }
  }, [user]);

  const fetchViewStats = async () => {
    setLoading(true);
    try {
      // Mock data for now - in production, fetch from analytics API
      // Simulating realistic view counts
      const mockStats: ViewStats = {
        total_views: 45230,
        today_views: 1240,
        this_week_views: 8650,
        this_month_views: 23180,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching view stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = (views: number): string => {
    const earnings = (views / 1000) * RPM;
    return earnings.toFixed(2);
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
          Please log in to view your creator fund earnings.
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Header />
      
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>
            💰 Creator Fund
          </h1>
          <p style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
          }}>
            Track your estimated earnings based on video views
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          padding: 16,
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 12,
          marginBottom: 32,
        }}>
          <div style={{
            fontSize: 14,
            color: 'rgba(212,175,55,0.9)',
            lineHeight: 1.6,
          }}>
            <strong>Current RPM:</strong> ${RPM.toFixed(2)} per 1,000 views
            <br />
            <small style={{ color: 'rgba(212,175,55,0.7)' }}>
              Earnings are estimated based on your video views. Actual payouts may vary.
            </small>
          </div>
        </div>

        {loading ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Loading earnings data...
          </div>
        ) : (
          <>
            {/* Earnings Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}>
              {/* Today */}
              <div style={{
                padding: 24,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 16,
              }}>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Today
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'rgba(212,175,55,0.9)',
                  marginBottom: 4,
                }}>
                  ${calculateEarnings(stats?.today_views || 0)}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {stats?.today_views.toLocaleString()} views
                </div>
              </div>

              {/* This Week */}
              <div style={{
                padding: 24,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: 16,
              }}>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  This Week
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'rgba(212,175,55,0.95)',
                  marginBottom: 4,
                }}>
                  ${calculateEarnings(stats?.this_week_views || 0)}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {stats?.this_week_views.toLocaleString()} views
                </div>
              </div>

              {/* This Month */}
              <div style={{
                padding: 24,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.1) 100%)',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: 16,
              }}>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  This Month
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'rgba(212,175,55,1)',
                  marginBottom: 4,
                }}>
                  ${calculateEarnings(stats?.this_month_views || 0)}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {stats?.this_month_views.toLocaleString()} views
                </div>
              </div>

              {/* All Time */}
              <div style={{
                padding: 24,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.12) 100%)',
                border: '1px solid rgba(212,175,55,0.5)',
                borderRadius: 16,
              }}>
                <div style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  All Time
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'rgba(212,175,55,1)',
                  marginBottom: 4,
                }}>
                  ${calculateEarnings(stats?.total_views || 0)}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  {stats?.total_views.toLocaleString()} views
                </div>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div style={{
              padding: 24,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              marginBottom: 24,
            }}>
              <h2 style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}>
                How It Works
              </h2>
              <div style={{
                display: 'grid',
                gap: 12,
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}>
                <div>
                  <strong style={{ color: 'rgba(212,175,55,0.9)' }}>✓</strong> Earn based on video views
                </div>
                <div>
                  <strong style={{ color: 'rgba(212,175,55,0.9)' }}>✓</strong> Current rate: ${RPM} per 1,000 views (RPM)
                </div>
                <div>
                  <strong style={{ color: 'rgba(212,175,55,0.9)' }}>✓</strong> Minimum payout: $50.00
                </div>
                <div>
                  <strong style={{ color: 'rgba(212,175,55,0.9)' }}>✓</strong> Payouts processed monthly
                </div>
              </div>
            </div>

            {/* Payment Integration Notice */}
            <div style={{
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
                💳 Payment integration coming soon
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
          </>
        )}
      </div>
    </div>
  );
}
