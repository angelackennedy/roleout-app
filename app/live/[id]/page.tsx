'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWebRTCViewer } from '@/lib/hooks/useWebRTCViewer';
import { useLiveChat } from '@/lib/hooks/useLiveChat';
import { useAuth } from '@/lib/auth-context';
import { formatRelativeTime } from '@/lib/time-utils';
import Link from 'next/link';
import LiveReactions from '@/components/LiveReactions';

type LiveSession = {
  id: string;
  user_id: string;
  title: string;
  is_live: boolean;
  started_at: string;
  ended_at: string | null;
  viewers: number;
};

export default function LiveViewerPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const viewerIncrementedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, remoteVideoRef } = useWebRTCViewer({
    sessionId,
    isLive: session?.is_live || false,
    onError: (err) => setError(err),
  });

  const { messages, messageCount, sending, sendMessage } = useLiveChat({
    sessionId,
    userId: user?.id || null,
    isLive: session?.is_live || false,
  });

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSession = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('Error fetching session:', fetchError);
        setError('Session not found');
      } else {
        setSession(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewer = async () => {
    if (viewerIncrementedRef.current) return;
    
    try {
      const { error } = await supabase.rpc('increment_viewer', {
        session_id: sessionId,
      });

      if (error) {
        console.error('Error incrementing viewer:', error);
        await supabase
          .from('live_sessions')
          .update({ viewers: (session?.viewers || 0) + 1 })
          .eq('id', sessionId);
      }
      
      viewerIncrementedRef.current = true;
    } catch (err) {
      console.error('Error incrementing viewer:', err);
    }
  };

  const decrementViewer = async () => {
    if (!viewerIncrementedRef.current) return;

    try {
      const { error } = await supabase.rpc('decrement_viewer', {
        session_id: sessionId,
      });

      if (error) {
        console.error('Error decrementing viewer:', error);
        await supabase
          .from('live_sessions')
          .update({ viewers: Math.max((session?.viewers || 1) - 1, 0) })
          .eq('id', sessionId);
      }
      
      viewerIncrementedRef.current = false;
    } catch (err) {
      console.error('Error decrementing viewer:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatError(null);

    const result = await sendMessage(chatInput);
    if (result.success) {
      setChatInput('');
    } else {
      setChatError(result.error || 'Failed to send message');
      setTimeout(() => setChatError(null), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const getInitials = (userId: string): string => {
    return userId.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    incrementViewer();

    const channel = supabase
      .channel(`live_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session updated:', payload);
          setSession(payload.new as LiveSession);
        }
      )
      .subscribe();

    return () => {
      decrementViewer();
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  if (loading) {
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

  if (error || !session) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{ fontSize: 24, marginBottom: 20 }}>❌ {error}</div>
        <Link href="/" className="nav-btn">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 1600,
        margin: '0 auto',
      }}>
        <div style={{
          marginBottom: 20,
        }}>
          <Link href="/" style={{
            color: 'rgba(212,175,55,0.8)',
            fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
          }}>
            ← Back to Home
          </Link>
        </div>

        <div style={{
          display: 'flex',
          gap: 20,
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        }}>
          {/* Video Section */}
          <div style={{
            flex: 1,
            minWidth: 0,
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              {/* Video Area */}
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%',
                background: '#000',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                }}>
                  {session.is_live ? (
                    <>
                      {isConnected ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <>
                          <div style={{ fontSize: 64, marginBottom: 16 }}>🔄</div>
                          <div style={{ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                            Connecting to stream...
                          </div>
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                            Establishing WebRTC connection
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 64, marginBottom: 16 }}>⏹️</div>
                      <div style={{ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                        Stream Ended
                      </div>
                      {session.ended_at && (
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                          Ended {formatRelativeTime(session.ended_at)}
                        </div>
                      )}
                    </>
                  )}

                  {session.is_live && (
                    <div style={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      background: '#ff0000',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      zIndex: 10,
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'white',
                        animation: 'pulse 2s infinite',
                      }} />
                      LIVE
                    </div>
                  )}

                  {session.is_live && isConnected && (
                    <div style={{
                      position: 'absolute',
                      top: 20,
                      right: 150,
                      background: 'rgba(0,255,0,0.7)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      zIndex: 10,
                    }}>
                      ✓ Connected
                    </div>
                  )}

                  <div style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    zIndex: 10,
                  }}>
                    👁️ {session.viewers} {session.viewers === 1 ? 'viewer' : 'viewers'}
                  </div>
                </div>
              </div>

              {/* Reactions Bar */}
              <div style={{ padding: '16px 24px', paddingTop: 0 }}>
                <LiveReactions sessionId={sessionId} userId={user?.id || null} />
              </div>

              {/* Info Section */}
              <div style={{ padding: 24 }}>
                <h1 style={{
                  fontSize: 28,
                  fontWeight: 700,
                  marginBottom: 12,
                  background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {session.title}
                </h1>

                <div style={{
                  display: 'flex',
                  gap: 20,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.6)',
                  flexWrap: 'wrap',
                }}>
                  <div>Started {formatRelativeTime(session.started_at)}</div>
                  <div>💬 {messageCount} {messageCount === 1 ? 'message' : 'messages'}</div>
                  {!session.is_live && session.ended_at && (
                    <div>
                      Duration: {Math.floor(
                        (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60
                      )}m
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div style={{
            width: window.innerWidth < 768 ? '100%' : 400,
            flexShrink: 0,
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: window.innerWidth < 768 ? 500 : 'calc(100vh - 140px)',
            }}>
              {/* Chat Header */}
              <div style={{
                padding: 16,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                }}>
                  Live Chat
                </h2>
                <p style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0,
                  marginTop: 4,
                }}>
                  {session.viewers} viewers • {messageCount} messages
                </p>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 14,
                    marginTop: 40,
                  }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} style={{
                      display: 'flex',
                      gap: 10,
                    }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {getInitials(msg.user_id)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                        }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: msg.user_id === user?.id ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.9)',
                          }}>
                            {msg.user_id === user?.id ? 'You' : getInitials(msg.user_id)}
                          </span>
                          <span style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.5)',
                          }}>
                            {formatRelativeTime(msg.created_at)}
                          </span>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.9)',
                          wordBreak: 'break-word',
                        }}>
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: 16,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
              }}>
                {user ? (
                  <form onSubmit={handleSendMessage}>
                    <div style={{
                      display: 'flex',
                      gap: 8,
                    }}>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={sending}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'white',
                          fontSize: 14,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sending || !chatInput.trim()}
                        className="nav-btn"
                        style={{
                          padding: '10px 20px',
                          fontSize: 14,
                          opacity: sending || !chatInput.trim() ? 0.5 : 1,
                          cursor: sending || !chatInput.trim() ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                    {chatError && (
                      <div style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: '#ff4444',
                      }}>
                        {chatError}
                      </div>
                    )}
                  </form>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: 12,
                    background: 'rgba(255,255,0,0.1)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,0,0.3)',
                  }}>
                    <p style={{
                      fontSize: 13,
                      margin: 0,
                      marginBottom: 8,
                      color: 'rgba(255,255,255,0.8)',
                    }}>
                      Sign in to join the chat
                    </p>
                    <Link href="/login" className="nav-btn" style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}>
                      Sign In →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
