'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MODE } from '@/lib/config';

let supabase: any = null;
if (MODE === "supabase") {
  const supabaseModule = require('@/lib/supabase');
  supabase = supabaseModule.supabase;
}

interface ModerationAction {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  moderator: {
    username: string;
  };
  post_id: string | null;
}

interface Flag {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  user: {
    username: string;
  };
  post_id: string;
}

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<'log' | 'flags'>('log');
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (MODE === "supabase") {
      fetchModerationLog();
      fetchFlags();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchModerationLog = async () => {
    if (MODE !== "supabase") return;

    try {
      const { data, error } = await supabase
        .from('moderation_actions')
        .select(`
          *,
          moderator:profiles!moderation_actions_moderator_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setModerationActions(data || []);
    } catch (error) {
      console.error('Error fetching moderation log:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlags = async () => {
    if (MODE !== "supabase") return;

    try {
      const { data, error } = await supabase
        .from('flags')
        .select(`
          *,
          user:profiles!flags_user_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching flags:', error);
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'remove':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'restore':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading moderation panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Moderation & Transparency Panel</h1>
          <p className="text-gray-600 dark:text-gray-400">
            FA³: Public transparency log of all moderation actions
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'log'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Moderation Log ({moderationActions.length})
            </button>
            <button
              onClick={() => setActiveTab('flags')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'flags'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Community Flags ({flags.length})
            </button>
          </nav>
        </div>

        {activeTab === 'log' && (
          <div className="space-y-4">
            {moderationActions.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                No moderation actions yet. All actions will be publicly logged here.
              </div>
            ) : (
              moderationActions.map((action) => (
                <div
                  key={action.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(
                          action.action_type
                        )}`}
                      >
                        {action.action_type.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        by {action.moderator.username}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Reason:</strong> {action.reason}
                  </p>
                  {action.post_id && (
                    <Link
                      href={`/post/${action.post_id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View affected post →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-4">
            {flags.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                No community flags yet. Users can flag content for review.
              </div>
            ) : (
              flags.map((flag) => (
                <div
                  key={flag.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          flag.status
                        )}`}
                      >
                        {flag.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        flagged by {flag.user.username}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(flag.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Reason:</strong> {flag.reason}
                  </p>
                  <Link
                    href={`/post/${flag.post_id}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View flagged post →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
