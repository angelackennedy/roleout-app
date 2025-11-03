'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMessages } from '@/lib/use-messages';
import Link from 'next/link';

export default function DMConversationPage() {
  const { conversationId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { messages, loading, error, sendMessage } = useMessages(
    conversationId as string,
    user?.id
  );
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageBody.trim() || sending) return;

    setSending(true);
    await sendMessage(messageBody);
    setMessageBody('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  const otherUser = messages.length > 0
    ? messages.find(m => m.sender_id !== user.id)?.sender
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Link href="/inbox" style={{
            color: 'rgba(212,175,55,0.8)',
            fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
          }}>
            ← Back to Inbox
          </Link>

          {otherUser && (
            <div style={{
              fontSize: 18,
              fontWeight: 600,
            }}>
              {otherUser.display_name || otherUser.username}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          maxWidth: 700,
          margin: '20px auto',
          background: 'rgba(255,0,0,0.1)',
          border: '1px solid rgba(255,0,0,0.3)',
          borderRadius: 8,
          padding: 12,
          color: '#ff6b6b',
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        maxWidth: 700,
        width: '100%',
        margin: '0 auto',
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 18,
              marginBottom: 8,
            }}>
              Start the conversation
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
            }}>
              Send a message below
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user.id;
            const showDate = index === 0 ||
              new Date(messages[index - 1].created_at).toDateString() !==
              new Date(message.created_at).toDateString();

            return (
              <div key={message.id}>
                {showDate && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    margin: '20px 0',
                  }}>
                    {new Date(message.created_at).toLocaleDateString()}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  marginBottom: 12,
                }}>
                  <div style={{
                    maxWidth: '70%',
                    background: isOwnMessage
                      ? 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(255,215,0,0.2) 100%)'
                      : 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}>
                    {!isOwnMessage && message.sender && (
                      <div style={{
                        fontSize: 12,
                        color: 'rgba(212,175,55,0.8)',
                        marginBottom: 4,
                        fontWeight: 600,
                      }}>
                        {message.sender.display_name || message.sender.username}
                      </div>
                    )}
                    <div style={{
                      fontSize: 15,
                      color: 'white',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {message.body}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 4,
                    }}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
        }}>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Press Enter to send)"
            disabled={sending}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: 12,
              color: 'white',
              fontSize: 15,
              resize: 'none',
              minHeight: 50,
              maxHeight: 150,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!messageBody.trim() || sending}
            style={{
              padding: '0 24px',
              background: messageBody.trim() && !sending
                ? 'linear-gradient(135deg, rgba(212,175,55,0.8) 0%, rgba(255,215,0,0.6) 100%)'
                : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: messageBody.trim() && !sending ? 'pointer' : 'not-allowed',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
