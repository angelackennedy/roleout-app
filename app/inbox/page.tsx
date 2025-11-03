'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useConversations } from '@/lib/use-conversations';
import Link from 'next/link';

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { conversations, loading, error } = useConversations(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
      }}>
        <div style={{
          marginBottom: 30,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/" style={{
            color: 'rgba(212,175,55,0.8)',
            fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
          }}>
            ← Back to Feed
          </Link>
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 10,
          background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Messages
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 30,
          fontSize: 14,
        }}>
          Your conversations
        </p>

        {error && (
          <div style={{
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: '#ff6b6b',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 60,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 18,
              marginBottom: 8,
            }}>
              No messages yet
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
            }}>
              Start a conversation from a user's profile
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {conversations.map((convo, index) => (
              <Link
                key={convo.id}
                href={`/dm/${convo.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 16,
                  borderBottom: index < conversations.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  textDecoration: 'none',
                  color: 'white',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: convo.other_user.avatar_url
                    ? `url(${convo.other_user.avatar_url})`
                    : 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(255,215,0,0.2) 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginRight: 16,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: 'rgba(212,175,55,0.8)',
                }}>
                  {!convo.other_user.avatar_url && (convo.other_user.username[0]?.toUpperCase() || '?')}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 4,
                  }}>
                    {convo.other_user.display_name || convo.other_user.username}
                  </div>
                  {convo.last_message ? (
                    <div style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.6)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {convo.last_message.sender_id === user.id ? 'You: ' : ''}
                      {convo.last_message.body}
                    </div>
                  ) : (
                    <div style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.4)',
                      fontStyle: 'italic',
                    }}>
                      No messages yet
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  marginLeft: 12,
                  flexShrink: 0,
                }}>
                  {convo.last_message &&
                    new Date(convo.last_message.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
