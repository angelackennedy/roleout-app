'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TimePeriod = 7 | 30 | 90;

type MetricData = {
  lifetime: number;
  last7: number;
  last30: number;
};

type AnalyticsData = {
  totalViews: MetricData;
  totalLikes: MetricData;
  totalComments: MetricData;
  totalFollowers: MetricData;
  dailyViews: Array<{
    date: string;
    views: number;
  }>;
  dailyEngagement: Array<{
    date: string;
    engagementRate: number;
  }>;
  topPosts: Array<{
    id: string;
    caption: string;
    media_url: string;
    media_type: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    created_at: string;
  }>;
  dailyFollowers: Array<{
    date: string;
    count: number;
  }>;
};

type EarningsData = {
  totalEarnings: number;
  totalViews: number;
  postsCount: number;
  posts: Array<{
    id: string;
    title: string;
    videoUrl: string | null;
    imageUrl: string | null;
    views: number;
    likes: number;
    comments: number;
    fairScore: number;
    earnings: number;
    createdAt: string;
  }>;
  weeklyHistory: Array<{
    weekStart: string;
    weekEnd: string;
    earnings: number;
    impressions: number;
    postsCount: number;
  }>;
};

type MallStats = {
  totalClicks: number;
  totalSales: number;
  totalRevenue: number;
  productsCount: number;
  topProducts: Array<{
    id: string;
    title: string;
    clicks: number;
    last_click_at: string | null;
  }>;
};

export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [mallStats, setMallStats] = useState<MallStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchAnalytics();
    fetchEarnings();
    fetchMallStats();
  }, [user, timePeriod]);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/earnings', { cache: 'no-store' });
      
      if (response.ok) {
        const earningsResponse = await response.json();
        setEarningsData(earningsResponse);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    }
  };

  const fetchMallStats = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/mall/stats', { cache: 'no-store' });
      
      if (response.ok) {
        const stats = await response.json();
        setMallStats(stats);
      }
    } catch (err) {
      console.error('Error fetching mall stats:', err);
    }
  };

  const fetchAnalytics = async () => {
    if (!user) {
      setError('Sign in required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `/api/analytics?userId=${user.id}&days=${timePeriod}`;
      console.log('Fetching analytics from:', url);
      
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch analytics' }));
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      
      if (analyticsData.error) {
        setData({
          totalViews: { lifetime: 0, last7: 0, last30: 0 },
          totalLikes: { lifetime: 0, last7: 0, last30: 0 },
          totalComments: { lifetime: 0, last7: 0, last30: 0 },
          totalFollowers: { lifetime: 0, last7: 0, last30: 0 },
          dailyViews: [],
          dailyEngagement: [],
          topPosts: [],
          dailyFollowers: [],
        });
      } else {
        setData(analyticsData);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setData({
        totalViews: { lifetime: 0, last7: 0, last30: 0 },
        totalLikes: { lifetime: 0, last7: 0, last30: 0 },
        totalComments: { lifetime: 0, last7: 0, last30: 0 },
        totalFollowers: { lifetime: 0, last7: 0, last30: 0 },
        dailyViews: [],
        dailyEngagement: [],
        topPosts: [],
        dailyFollowers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-2xl mb-4">❌ {error || 'Failed to load data'}</div>
        <Link href="/" className="text-yellow-500 hover:text-yellow-400 underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Creator Dashboard</h1>
            <Link href="/" className="text-yellow-500 hover:text-yellow-400 text-sm underline">
              ← Back to Home
            </Link>
          </div>

          <div className="flex gap-2">
            {[7, 30, 90].map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period as TimePeriod)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  timePeriod === period
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {period}d
              </button>
            ))}
          </div>
        </div>

        {mallStats && mallStats.productsCount > 0 && (
          <>
            <Link
              href="/mall/manage"
              className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 shadow-lg mb-4 block hover:shadow-xl transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-indigo-200 mb-1">🛍️ Mall Performance</div>
                  <div className="text-4xl font-bold">{mallStats.productsCount} Products</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">${mallStats.totalRevenue.toFixed(2)}</div>
                  <div className="text-xs text-indigo-200">Total Revenue</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-indigo-200 opacity-75">Total Clicks (Tracked)</div>
                  <div className="font-bold text-lg">{mallStats.totalClicks}</div>
                </div>
                <div>
                  <div className="text-indigo-200 opacity-75">Sales</div>
                  <div className="font-bold text-lg">{mallStats.totalSales}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-indigo-200 opacity-75 text-center">
                Click to manage your products →
              </div>
            </Link>
            
            {mallStats.topProducts && mallStats.topProducts.length > 0 && (
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-lg font-semibold mb-4 text-purple-200">📊 Top Products by Clicks</h3>
                <div className="space-y-3">
                  {mallStats.topProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between bg-black bg-opacity-20 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl font-bold text-yellow-400 w-8">#{index + 1}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-white line-clamp-1">{product.title}</div>
                          {product.last_click_at && (
                            <div className="text-xs text-purple-300">
                              Last click: {new Date(product.last_click_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-purple-200">{product.clicks}</div>
                        <div className="text-xs text-purple-400">clicks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-purple-200 mb-2">Total Views</div>
            <div className="text-4xl font-bold mb-3">{data.totalViews.lifetime.toLocaleString()}</div>
            <div className="space-y-1 text-xs text-purple-200">
              <div className="flex justify-between">
                <span>Last 7 days:</span>
                <span className="font-semibold">{data.totalViews.last7.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last 30 days:</span>
                <span className="font-semibold">{data.totalViews.last30.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-pink-200 mb-2">Total Likes</div>
            <div className="text-4xl font-bold mb-3">{data.totalLikes.lifetime.toLocaleString()}</div>
            <div className="space-y-1 text-xs text-pink-200">
              <div className="flex justify-between">
                <span>Last 7 days:</span>
                <span className="font-semibold">{data.totalLikes.last7.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last 30 days:</span>
                <span className="font-semibold">{data.totalLikes.last30.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-blue-200 mb-2">Total Comments</div>
            <div className="text-4xl font-bold mb-3">{data.totalComments.lifetime.toLocaleString()}</div>
            <div className="space-y-1 text-xs text-blue-200">
              <div className="flex justify-between">
                <span>Last 7 days:</span>
                <span className="font-semibold">{data.totalComments.last7.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last 30 days:</span>
                <span className="font-semibold">{data.totalComments.last30.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-lg">
            <div className="text-sm font-semibold text-green-200 mb-2">Total Followers</div>
            <div className="text-4xl font-bold mb-3">{data.totalFollowers.lifetime.toLocaleString()}</div>
            <div className="space-y-1 text-xs text-green-200">
              <div className="flex justify-between">
                <span>Last 7 days:</span>
                <span className="font-semibold">{data.totalFollowers.last7.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last 30 days:</span>
                <span className="font-semibold">{data.totalFollowers.last30.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {earningsData && (
          <div className="bg-gradient-to-br from-yellow-600 to-amber-800 rounded-xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-yellow-200 mb-1">💰 Fair Earnings (Demo)</div>
                <div className="text-5xl font-bold">${earningsData.totalEarnings.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-yellow-200 opacity-75 mb-2">Formula: Views × FairScore × 0.001</div>
                <div className="text-sm text-yellow-100">
                  {earningsData.postsCount} posts • {earningsData.totalViews.toLocaleString()} views
                </div>
              </div>
            </div>
            <div className="text-xs text-yellow-200 opacity-75 border-t border-yellow-500/30 pt-3">
              This is a demo calculation. Real payouts would integrate with payment providers like Stripe Connect.
            </div>
          </div>
        )}

        {/* Creator Monetization Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/creator/fund"
            className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">💰</div>
              <div className="text-xs text-yellow-200 uppercase font-semibold">Creator Fund</div>
            </div>
            <div className="text-xl font-bold mb-1">View Earnings</div>
            <div className="text-sm text-yellow-200">Track your estimated revenue from video views</div>
          </Link>

          <Link 
            href="/creator/gifts"
            className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">🎁</div>
              <div className="text-xs text-orange-200 uppercase font-semibold">Virtual Gifts</div>
            </div>
            <div className="text-xl font-bold mb-1">Gifts Received</div>
            <div className="text-sm text-orange-200">View gifts from your fans and supporters</div>
          </Link>
        </div>

        {/* Views per day chart */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Views per Day (Last 30 Days)</h2>
          {data.dailyViews.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#A855F7" 
                  strokeWidth={3}
                  dot={{ fill: '#A855F7', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">👁️</div>
              <div className="text-xl mb-2">No views yet</div>
              <div className="text-sm">When people watch your posts, views will appear here</div>
            </div>
          )}
        </div>

        {/* Engagement rate chart */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Engagement Rate per Day (Last 30 Days)</h2>
          <p className="text-sm text-gray-400 mb-4">Engagement Rate = (Likes + Comments) / Views × 100%</p>
          {data.dailyEngagement.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyEngagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number) => [`${value}%`, 'Engagement Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="engagementRate" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Engagement Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl mb-2">No engagement data yet</div>
              <div className="text-sm">Engagement data will appear when your posts get views, likes, and comments</div>
            </div>
          )}
        </div>

        {data.dailyFollowers.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Follower Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyFollowers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {earningsData && earningsData.posts.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Per-Post Earnings Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-300">Post</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Views</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Likes</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">FairScore</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData.posts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                      <td className="py-3 px-2">
                        <Link href={`/post/${post.id}`} className="flex items-center gap-3 hover:text-yellow-400 transition">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                            {post.videoUrl ? (
                              <video 
                                src={post.videoUrl} 
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : post.imageUrl ? (
                              <img 
                                src={post.imageUrl} 
                                alt="Post thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {post.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {post.likes.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-bold text-sm ${
                          post.fairScore >= 0.7 ? 'text-green-400' :
                          post.fairScore >= 0.4 ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {post.fairScore.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-yellow-400">
                          ${post.earnings.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {earningsData && earningsData.weeklyHistory.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Fair Payout History (Weekly)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-300">Week</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Posts</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Impressions</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData.weeklyHistory.map((week, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                      <td className="py-3 px-2">
                        <div className="text-sm font-medium">
                          {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {week.postsCount}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {week.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-yellow-400">
                          ${week.earnings.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Top Performing Posts</h2>
          
          {data.topPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl">No posts yet</div>
              <div className="text-sm mt-2">Start creating content to see your analytics!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-300">Post</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Views</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Likes</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Comments</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-300">Engagement Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPosts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                      <td className="py-3 px-2">
                        <Link href={`/post/${post.id}`} className="flex items-center gap-3 hover:text-yellow-400 transition">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                            {post.media_type === 'video' ? (
                              <video 
                                src={post.media_url} 
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <img 
                                src={post.media_url} 
                                alt="Post thumbnail"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {post.caption || 'No caption'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(post.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {post.likes.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm">
                        {post.comments.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-bold text-sm ${
                          post.engagementRate >= 10 ? 'text-green-400' :
                          post.engagementRate >= 5 ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {post.engagementRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
