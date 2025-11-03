'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/time-utils';
import Link from 'next/link';

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
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerIncrementedRef = useRef(false);

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
        // Fallback to manual increment
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
        // Fallback to manual decrement
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

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    // Increment viewer count on mount
    incrementViewer();

    // Subscribe to realtime changes for this session
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

    // Decrement viewer count on unmount
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
        maxWidth: 1200,
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
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Video Area */}
          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                  <div style={{
                    fontSize: 64,
                    marginBottom: 16,
                  }}>
                    🎥
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.8)',
                  }}>
                    Live Stream
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 8,
                  }}>
                    (Video player integration coming soon)
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 64,
                    marginBottom: 16,
                  }}>
                    ⏹️
                  </div>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                  }}>
                    Stream Ended
                  </div>
                  {session.ended_at && (
                    <div style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 8,
                    }}>
                      Ended {formatRelativeTime(session.ended_at)}
                    </div>
                  )}
                </>
              )}

              {/* Live indicator */}
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

              {/* Viewer count */}
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
              }}>
                👁️ {session.viewers} {session.viewers === 1 ? 'viewer' : 'viewers'}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{
            padding: 24,
          }}>
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
              <div>
                Started {formatRelativeTime(session.started_at)}
              </div>
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
