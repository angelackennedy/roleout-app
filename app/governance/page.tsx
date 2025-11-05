'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';

interface WeeklyData {
  week: string;
  average: number;
  count: number;
}

interface ChangelogEntry {
  id: string;
  version: string;
  description: string;
  changes: any;
  created_at: string;
  created_by: string | null;
}

interface VoteEligibility {
  canVote: boolean;
  reason?: string;
  nextVoteDate?: string;
  lastVoteDate?: string;
}

interface AlgorithmWeights {
  likes_weight: number;
  comments_weight: number;
  watch_completion_weight: number;
  updated_at: string;
}

export default function GovernancePage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [overallAverage, setOverallAverage] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [weights, setWeights] = useState<AlgorithmWeights | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteEligibility, setVoteEligibility] = useState<VoteEligibility>({ canVote: false });
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editLikes, setEditLikes] = useState(0.4);
  const [editComments, setEditComments] = useState(0.4);
  const [editWatch, setEditWatch] = useState(0.2);
  const [editDescription, setEditDescription] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    if (user) {
      checkVoteEligibility();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, changelogRes, weightsRes] = await Promise.all([
        fetch('/api/governance/stats'),
        fetch('/api/governance/changelog'),
        fetch('/api/transparency/weights'),
      ]);

      const statsData = await statsRes.json();
      const changelogData = await changelogRes.json();
      const weightsData = await weightsRes.json();

      setWeeklyData(statsData.weeklyData || []);
      setOverallAverage(statsData.overallAverage || 0);
      setTotalVotes(statsData.totalVotes || 0);
      setChangelog(changelogData.changelog || []);
      setWeights(weightsData.weights || null);
      
      if (weightsData.weights) {
        setEditLikes(weightsData.weights.likes_weight);
        setEditComments(weightsData.weights.comments_weight);
        setEditWatch(weightsData.weights.watch_completion_weight);
      }
    } catch (error) {
      console.error('Error fetching governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVoteEligibility = async () => {
    try {
      const res = await fetch('/api/governance/vote');
      const data = await res.json();
      setVoteEligibility(data);
    } catch (error) {
      console.error('Error checking vote eligibility:', error);
    }
  };

  const handleSubmitVote = async () => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    if (selectedRating === 0) {
      alert('Please select a fairness rating');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/governance/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fairness_score: selectedRating,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        alert(data.error || 'You can only vote once per 7 days');
      } else if (res.status === 401) {
        alert('Please log in to vote');
      } else if (res.ok) {
        alert('Thank you for your feedback!');
        setSelectedRating(0);
        setComment('');
        await fetchData();
        await checkVoteEligibility();
      } else {
        alert(data.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Error submitting vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishWeights = async () => {
    if (!user || !isAdmin(user.email)) {
      alert('Unauthorized');
      return;
    }

    const total = editLikes + editComments + editWatch;
    if (Math.abs(total - 1.0) > 0.01) {
      alert('Weights must sum to 1.0 (currently: ' + total.toFixed(2) + ')');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/transparency/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          likes_weight: editLikes,
          comments_weight: editComments,
          watch_completion_weight: editWatch,
          description: editDescription.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to update weights');
      } else {
        alert('✅ Algorithm weights updated successfully!');
        setEditMode(false);
        setEditDescription('');
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating weights:', error);
      alert('Error updating weights');
    } finally {
      setSubmitting(false);
    }
  };

  const maxAverage = Math.max(...weeklyData.map(d => d.average), 5);
  const chartHeight = 200;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'white' }}>
        <p>Loading governance data...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: 40 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 10 }}>
          Community Governance
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>
          Help shape the algorithm by providing feedback on fairness
        </p>

        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Current Algorithm Weights
          </h2>
          {weights ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Likes</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#d4af37' }}>
                    {(weights.likes_weight * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Comments</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#d4af37' }}>
                    {(weights.comments_weight * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 4 }}>Watch Time</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#d4af37' }}>
                    {(weights.watch_completion_weight * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, opacity: 0.5, textAlign: 'center' }}>
                Last updated: {new Date(weights.updated_at).toLocaleDateString()}
              </div>

              {user && isAdmin(user.email) && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    width: '100%',
                    marginTop: 20,
                    padding: '12px 20px',
                    background: '#d4af37',
                    color: '#0a0a0a',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  ✏️ Edit Algorithm Weights
                </button>
              )}

              {editMode && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Edit Algorithm Weights (Admin Only)
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4, opacity: 0.8 }}>
                        Likes Weight
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={editLikes}
                        onChange={(e) => setEditLikes(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 14,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4, opacity: 0.8 }}>
                        Comments Weight
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={editComments}
                        onChange={(e) => setEditComments(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 14,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4, opacity: 0.8 }}>
                        Watch Time Weight
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={editWatch}
                        onChange={(e) => setEditWatch(parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 14,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, marginBottom: 4, opacity: 0.8 }}>
                        Description (optional)
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="e.g., Raised watch weight from 0.2 → 0.3"
                        maxLength={200}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 14,
                          minHeight: 60,
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      Total: {((editLikes + editComments + editWatch) * 100).toFixed(0)}%
                      {Math.abs((editLikes + editComments + editWatch) - 1.0) > 0.01 && (
                        <span style={{ color: '#ff4444', marginLeft: 8 }}>
                          (must equal 100%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handlePublishWeights}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: '#d4af37',
                        color: '#0a0a0a',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.5 : 1,
                      }}
                    >
                      {submitting ? 'Publishing...' : '📢 Publish Update'}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        if (weights) {
                          setEditLikes(weights.likes_weight);
                          setEditComments(weights.comments_weight);
                          setEditWatch(weights.watch_completion_weight);
                        }
                      }}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>
              Loading algorithm weights...
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
              Fairness Rating
            </h2>

            {!user ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ marginBottom: 16, opacity: 0.7 }}>
                  Please log in to submit your feedback
                </p>
                <Link href="/auth/login" className="nav-btn">
                  Log In
                </Link>
              </div>
            ) : !voteEligibility.canVote ? (
              <div>
                <div style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>
                  <p style={{ marginBottom: 8 }}>{voteEligibility.reason}</p>
                  {voteEligibility.nextVoteDate && (
                    <p style={{ fontSize: 13 }}>
                      Next vote available: {new Date(voteEligibility.nextVoteDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: 12, fontSize: 14 }}>
                  How fair is the current algorithm?
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating)}
                      style={{
                        fontSize: 32,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        opacity: selectedRating >= rating ? 1 : 0.3,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, textAlign: 'center', marginBottom: 16, opacity: 0.6 }}>
                  1 = Very Unfair, 5 = Very Fair
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional: Share your thoughts..."
                  maxLength={500}
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: 14,
                    resize: 'vertical',
                    marginBottom: 16,
                  }}
                />
                <button
                  onClick={handleSubmitVote}
                  disabled={submitting || selectedRating === 0}
                  className="nav-btn"
                  style={{
                    width: '100%',
                    opacity: submitting || selectedRating === 0 ? 0.5 : 1,
                    cursor: submitting || selectedRating === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
              Community Sentiment
            </h2>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#d4af37', textAlign: 'center' }}>
                {overallAverage.toFixed(1)} / 5.0
              </div>
              <div style={{ textAlign: 'center', fontSize: 14, opacity: 0.6, marginTop: 8 }}>
                Based on {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <span
                  key={rating}
                  style={{
                    fontSize: 24,
                    opacity: overallAverage >= rating ? 1 : 0.2,
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
            Weekly Fairness Trend
          </h2>
          {weeklyData.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: 40 }}>
              No voting data yet. Be the first to provide feedback!
            </p>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 4,
                  height: chartHeight,
                  padding: '20px 0',
                }}
              >
                {weeklyData.map((data, index) => {
                  const barHeight = (data.average / maxAverage) * chartHeight;
                  return (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#d4af37',
                          minHeight: 20,
                        }}
                      >
                        {data.average.toFixed(1)}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: barHeight,
                          background: 'linear-gradient(180deg, #d4af37 0%, rgba(212,175,55,0.3) 100%)',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                        }}
                        title={`Week of ${data.week}: ${data.average.toFixed(1)} (${data.count} votes)`}
                      />
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.5,
                          textAlign: 'center',
                          maxWidth: 60,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(data.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 13,
                  opacity: 0.7,
                  textAlign: 'center',
                }}
              >
                Weekly average fairness ratings over the last 12 weeks
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>
            Algorithm Changelog
          </h2>
          {changelog.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: 40 }}>
              No algorithm changes recorded yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {changelog.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: 20,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    borderLeft: '3px solid #d4af37',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          background: 'rgba(212,175,55,0.2)',
                          border: '1px solid rgba(212,175,55,0.4)',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#d4af37',
                          marginRight: 12,
                        }}
                      >
                        v{entry.version}
                      </span>
                      <span style={{ fontSize: 13, opacity: 0.6 }}>
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: 15, lineHeight: 1.6 }}>
                    {entry.description}
                  </p>
                  {entry.changes && (
                    <div
                      style={{
                        padding: 12,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        fontSize: 13,
                        fontFamily: 'monospace',
                      }}
                    >
                      {Object.entries(entry.changes).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: 4 }}>
                          <span style={{ color: '#d4af37' }}>{key}:</span>{' '}
                          <span>{typeof value === 'number' ? (value * 100).toFixed(0) + '%' : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 40, padding: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            About Community Governance
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.8, marginBottom: 12 }}>
            Your feedback helps us improve the algorithm. We track community sentiment over time and use it to inform
            algorithm adjustments. You can vote once per week to share your opinion on algorithm fairness.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.7 }}>
            All changes to the algorithm are documented in the changelog above. For detailed technical information
            about how the algorithm works, visit the{' '}
            <Link href="/transparency" style={{ color: '#d4af37', textDecoration: 'none' }}>
              Transparency Dashboard
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
