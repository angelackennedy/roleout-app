'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReportDialogProps {
  postId: string;
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDialog({ postId, userId, isOpen, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to report');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: userId,
        post_id: postId,
        reason: reason.trim() || null,
      });

    setIsSubmitting(false);

    if (reportError) {
      if (reportError.code === '23505') {
        setError('You have already reported this post');
      } else {
        setError('Failed to submit report. Please try again.');
      }
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onClose();
      setSuccess(false);
      setReason('');
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          border: '2px solid rgba(212,175,55,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, marginBottom: 16, fontSize: 20, fontWeight: 600, color: 'white' }}>
          Report Post
        </h2>

        {success ? (
          <div style={{
            padding: 20,
            textAlign: 'center',
            color: '#4ade80',
            fontSize: 16,
          }}>
            ✓ Report submitted. This post will be hidden from your feed.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="reason"
                style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}
              >
                Reason (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you reporting this post?"
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: 12,
                marginBottom: 16,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: 14,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: 12,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: 12,
                  background: isSubmitting 
                    ? 'rgba(212,175,55,0.5)' 
                    : 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
