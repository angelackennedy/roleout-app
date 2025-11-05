'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface PostMetric {
  id: string;
  caption: string | null;
  fair_score: number;
  likes: number;
  comments: number;
  impressions: number;
  watch_completion: number;
}

interface AlgorithmWeights {
  id: string;
  likes_weight: number;
  comments_weight: number;
  watch_completion_weight: number;
  updated_at: string;
  updated_by: string | null;
}

export default function TransparencyPage() {
  const [topPosts, setTopPosts] = useState<PostMetric[]>([]);
  const [weights, setWeights] = useState<AlgorithmWeights | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editWeights, setEditWeights] = useState({ likes: 0.4, comments: 0.4, watch: 0.2 });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [postsRes, weightsRes] = await Promise.all([
        fetch('/api/transparency/posts'),
        fetch('/api/transparency/weights'),
      ]);

      const postsData = await postsRes.json();
      const weightsData = await weightsRes.json();

      setTopPosts(postsData.posts || []);
      setWeights(weightsData.weights);
      
      if (weightsData.weights) {
        setEditWeights({
          likes: weightsData.weights.likes_weight,
          comments: weightsData.weights.comments_weight,
          watch: weightsData.weights.watch_completion_weight,
        });
      }
    } catch (error) {
      console.error('Error fetching transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeights = async () => {
    if (!user) {
      alert('You must be logged in to update algorithm weights');
      return;
    }

    const total = editWeights.likes + editWeights.comments + editWeights.watch;
    if (Math.abs(total - 1.0) > 0.01) {
      alert('Weights must sum to 1.0 (100%)');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/transparency/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likes_weight: editWeights.likes,
          comments_weight: editWeights.comments,
          watch_completion_weight: editWeights.watch,
        }),
      });

      if (response.status === 401) {
        alert('Unauthorized - please log in to update algorithm weights');
        setEditMode(false);
      } else if (response.ok) {
        await fetchData();
        setEditMode(false);
        alert('Algorithm weights updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update weights');
      }
    } catch (error) {
      console.error('Error updating weights:', error);
      alert('Error updating weights');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'white' }}>
        <p>Loading transparency data...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: 40 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>
          Transparency Dashboard
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>
          View how our algorithm works and see top-performing content
        </p>

        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
            Algorithm Weights
          </h2>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 24,
            }}
          >
            {!editMode ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Likes Weight</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#d4af37' }}>
                      {((weights?.likes_weight || 0.4) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Comments Weight</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#d4af37' }}>
                      {((weights?.comments_weight || 0.4) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Watch Completion Weight</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#d4af37' }}>
                      {((weights?.watch_completion_weight || 0.2) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 16 }}>
                  Last updated: {weights?.updated_at ? new Date(weights.updated_at).toLocaleString() : 'Never'}
                </div>
                {user && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="nav-btn"
                    style={{ fontSize: 14 }}
                  >
                    Edit Weights (Admin)
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>
                      Likes Weight: {(editWeights.likes * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editWeights.likes}
                      onChange={(e) => setEditWeights({ ...editWeights, likes: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>
                      Comments Weight: {(editWeights.comments * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editWeights.comments}
                      onChange={(e) => setEditWeights({ ...editWeights, comments: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>
                      Watch Completion Weight: {(editWeights.watch * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editWeights.watch}
                      onChange={(e) => setEditWeights({ ...editWeights, watch: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6 }}>
                    Total: {((editWeights.likes + editWeights.comments + editWeights.watch) * 100).toFixed(0)}%
                    {Math.abs(editWeights.likes + editWeights.comments + editWeights.watch - 1.0) > 0.01 && (
                      <span style={{ color: '#ff6b6b', marginLeft: 8 }}>
                        (Must equal 100%)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleSaveWeights}
                    disabled={saving}
                    className="nav-btn"
                    style={{ fontSize: 14, opacity: saving ? 0.5 : 1 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditWeights({
                        likes: weights?.likes_weight || 0.4,
                        comments: weights?.comments_weight || 0.4,
                        watch: weights?.watch_completion_weight || 0.2,
                      });
                    }}
                    className="nav-btn"
                    style={{ fontSize: 14, background: 'rgba(255,255,255,0.1)' }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
            Top 50 Posts by Fair Score
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>
                    Rank
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>
                    Post ID
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600 }}>
                    Caption
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    Fair Score
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    Views
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    Likes
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    Comments
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                    Watch %
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPosts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                      No posts with metrics yet
                    </td>
                  </tr>
                ) : (
                  topPosts.map((post, index) => (
                    <tr
                      key={post.id}
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                        #{index + 1}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', opacity: 0.7 }}>
                        <Link
                          href={`/post/${post.id}`}
                          style={{ color: '#d4af37', textDecoration: 'none' }}
                        >
                          {post.id.substring(0, 8)}...
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.caption || '(no caption)'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, textAlign: 'right', color: '#d4af37' }}>
                        {post.fair_score.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                        {post.impressions}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                        {post.likes}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                        {post.comments}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                        {(post.watch_completion * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 40, padding: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            About Fair Score
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, marginBottom: 12 }}>
            Fair Score is calculated using the formula:
          </p>
          <code style={{ display: 'block', padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', marginBottom: 12 }}>
            (likes × {((weights?.likes_weight || 0.4) * 100).toFixed(0)}% + comments × {((weights?.comments_weight || 0.4) * 100).toFixed(0)}% + watch_completion × {((weights?.watch_completion_weight || 0.2) * 100).toFixed(0)}%) / impressions
          </code>
          <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.7 }}>
            This transparency dashboard allows users to see exactly how content is ranked and what factors contribute to visibility.
            All data is public and read-only to ensure fairness and accountability in our recommendation algorithm.
          </p>
        </div>
      </div>
    </div>
  );
}
