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

export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchAnalytics();
  }, [user, timePeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/creator/analytics?days=${timePeriod}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
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
