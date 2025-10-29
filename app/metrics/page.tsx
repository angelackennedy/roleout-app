'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MetricsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics & Metrics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            FA⁵: Analytics dashboard and A/B testing (placeholder)
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center mb-8">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-4">Metrics Dashboard Coming Soon</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            This module will provide detailed analytics, engagement metrics, and A/B testing
            capabilities for creators and the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-semibold mb-2">Audience Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Track viewer demographics, watch patterns, and engagement trends
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Views</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unique Viewers</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Watch Time</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold mb-2">Engagement Metrics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Monitor likes, comments, shares, and overall engagement rates
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Engagement Rate</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comments/View</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Like Rate</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-semibold mb-2">Growth Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Monitor follower growth, content performance over time
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">7-Day Growth</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">30-Day Growth</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Content</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-3">🔬</div>
            <h3 className="text-xl font-semibold mb-2">A/B Testing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Test different captions, thumbnails, and posting times
            </p>
            <div className="text-sm text-gray-500">
              <ul className="space-y-1">
                <li>• Caption variants</li>
                <li>• Posting time optimization</li>
                <li>• Content strategy testing</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Ranking Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Understand how your content ranks in the feed algorithm
            </p>
            <div className="text-sm text-gray-500">
              <ul className="space-y-1">
                <li>• Feed placement tracking</li>
                <li>• Engagement velocity</li>
                <li>• Transparency reports</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-semibold mb-2">Feedback Collection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gather and analyze user feedback on content and features
            </p>
            <div className="text-sm text-gray-500">
              <ul className="space-y-1">
                <li>• User surveys</li>
                <li>• Feature requests</li>
                <li>• Content quality reports</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Planned Features (FA⁵)</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Real-time analytics dashboard with live metrics</li>
            <li>• Export reports (CSV, PDF) for analysis</li>
            <li>• Custom date range filtering and comparisons</li>
            <li>• A/B testing framework for content optimization</li>
            <li>• Engagement prediction models</li>
            <li>• Automated insights and recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
