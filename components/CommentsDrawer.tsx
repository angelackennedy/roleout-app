'use client';

import { useState, useRef, useEffect } from 'react';
import { usePostComments, Comment } from '@/lib/hooks/usePostComments';
import { formatRelativeTime } from '@/lib/time-utils';
import Link from 'next/link';

interface CommentsDrawerProps {
  postId: string;
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsDrawer({ postId, userId, isOpen, onClose }: CommentsDrawerProps) {
  const { comments, loading, addComment } = usePostComments({ postId, userId });
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (comments.length > 0) {
      scrollToBottom();
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !userId || sending) return;

    try {
      setSending(true);
      await addComment(message);
      setMessage('');
    } catch (err) {
      console.error('Failed to send comment:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70vh',
          background: 'linear-gradient(to bottom, rgba(30,30,30,0.98) 0%, rgba(20,20,20,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: 0 }}>
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              color: 'white',
              cursor: 'pointer',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: 20 }}>
              Loading comments...
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.6)',
                padding: 40,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div>No comments yet. Be the first!</div>
            </div>
          )}

          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(10,10,10,0.9)',
          }}
        >
          {userId ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a comment..."
                disabled={sending}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 24,
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!message.trim() || sending}
                style={{
                  background: message.trim() && !sending
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(212,175,55,0.6) 100%)'
                    : 'rgba(100,100,100,0.3)',
                  border: 'none',
                  borderRadius: 24,
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: message.trim() && !sending ? 'pointer' : 'not-allowed',
                  opacity: message.trim() && !sending ? 1 : 0.5,
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14,
              }}
            >
              <Link
                href="/auth/login"
                style={{
                  color: 'rgba(212,175,55,0.9)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign in
              </Link>{' '}
              to comment
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Link
        href={`/u/${comment.profiles.username}`}
        style={{
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: comment.profiles.avatar_url
              ? `url(${comment.profiles.avatar_url}) center/cover`
              : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: 'white',
          }}
        >
          {!comment.profiles.avatar_url && comment.profiles.username.slice(0, 2).toUpperCase()}
        </div>
      </Link>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Link
            href={`/u/${comment.profiles.username}`}
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {comment.profiles.display_name || comment.profiles.username}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {comment.message}
        </div>
      </div>
    </div>
  );
}
