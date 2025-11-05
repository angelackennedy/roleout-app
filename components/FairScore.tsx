'use client';

import { useState } from 'react';

interface FairScoreProps {
  score: number;
  likes: number;
  comments: number;
  impressions: number;
  watchCompletion: number;
}

export function FairScore({ score, likes, comments, impressions, watchCompletion }: FairScoreProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const likesPercent = impressions > 0 ? ((likes / impressions) * 100).toFixed(1) : '0.0';
  const commentsPercent = impressions > 0 ? ((comments / impressions) * 100).toFixed(1) : '0.0';
  const watchPercent = (watchCompletion * 100).toFixed(1);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>
        Fair Score: {score.toFixed(2)}
      </span>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 10,
          color: 'white',
          padding: 0,
        }}
      >
        i
      </button>
      
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 8,
            background: 'rgba(0,0,0,0.95)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: 12,
            minWidth: 200,
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'rgba(212,175,55,1)' }}>
            Score Breakdown
          </div>
          <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.8 }}>Likes (40%):</span>
              <span style={{ fontWeight: 600 }}>{likesPercent}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.8 }}>Comments (40%):</span>
              <span style={{ fontWeight: 600 }}>{commentsPercent}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.8 }}>Watch Time (20%):</span>
              <span style={{ fontWeight: 600 }}>{watchPercent}%</span>
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 10, opacity: 0.7 }}>
              {impressions} total views
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
