'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useWebRTCBroadcaster } from '@/lib/hooks/useWebRTCBroadcaster';
import Link from 'next/link';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const { isStreaming, localVideoRef, startBroadcast, stopBroadcast } = useWebRTCBroadcaster({
    sessionId: sessionId || '',
    onError: (error) => setStatus(`❌ ${error}`),
  });

  useEffect(() => {
    if (user) {
      setStatus(`✅ Logged in as user: ${user.id}`);
    } else {
      setStatus('⚠️ Not logged in - please sign in first');
    }
  }, [user]);

  const testInsert = async () => {
    if (!user) {
      setStatus('❌ Error: You must be logged in to create a session');
      return;
    }

    setLoading(true);
    setStatus('Inserting new live session...');

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .insert({
          user_id: user.id,
          title: 'Live Test',
          is_live: false,
          started_at: new Date().toISOString(),
          viewers: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        setStatus(`❌ Error: ${error.message}`);
      } else {
        console.log('Insert success:', data);
        setSessionId(data.id);
        setStatus(`✅ Successfully created session with ID: ${data.id}`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus(`❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goLive = async () => {
    if (!user) {
      setStatus('❌ Error: You must be logged in');
      return;
    }

    if (!sessionId) {
      setStatus('⚠️ Please create a session first');
      return;
    }

    setLoading(true);
    setStatus('Starting camera and going live...');

    try {
      // Start webcam and WebRTC broadcast
      await startBroadcast();

      // Update database
      const { data, error } = await supabase
        .from('live_sessions')
        .update({
          is_live: true,
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Go live error:', error);
        setStatus(`❌ Error: ${error.message}`);
        stopBroadcast();
      } else {
        console.log('Go live success:', data);
        setIsLive(true);
        setStatus(`✅ Session ${sessionId} is now LIVE with camera! 🔴`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus(`❌ Unexpected error: ${err.message}`);
      stopBroadcast();
    } finally {
      setLoading(false);
    }
  };

  const endLive = async () => {
    if (!user) {
      setStatus('❌ Error: You must be logged in');
      return;
    }

    if (!sessionId) {
      setStatus('⚠️ Please create a session first');
      return;
    }

    setLoading(true);
    setStatus('Ending live session...');

    try {
      // Stop WebRTC broadcast
      stopBroadcast();

      // Update database
      const { data, error } = await supabase
        .from('live_sessions')
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('End live error:', error);
        setStatus(`❌ Error: ${error.message}`);
      } else {
        console.log('End live success:', data);
        setIsLive(false);
        setStatus(`✅ Session ${sessionId} ended successfully`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus(`❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSessions = async () => {
    if (!user) {
      setStatus('❌ Error: You must be logged in');
      return;
    }

    setLoading(true);
    setStatus('Fetching all sessions...');

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Fetch error:', error);
        setStatus(`❌ Error: ${error.message}`);
      } else {
        console.log('Fetched sessions:', data);
        setStatus(`✅ Fetched ${data.length} sessions for your user (check console for details)`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus(`❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (isStreaming) {
        stopBroadcast();
      }
      await supabase.auth.signOut();
      setStatus('✅ Signed out successfully');
      setSessionId(null);
      setIsLive(false);
    } catch (err: any) {
      setStatus(`❌ Error signing out: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
      color: 'white',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 10,
          background: 'linear-gradient(135deg, #fff 0%, rgba(212,175,55,0.8) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Supabase Live Sessions
        </h1>
        
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 30,
          fontSize: 14,
        }}>
          Test authenticated live session management with WebRTC
        </p>

        {/* Video Preview Section */}
        {isStreaming && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ff0000',
                animation: 'pulse 2s infinite',
              }} />
              <h2 style={{
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}>
                Camera Preview (Broadcasting)
              </h2>
            </div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                borderRadius: 8,
                background: '#000',
                aspectRatio: '16/9',
              }}
            />
            <p style={{
              marginTop: 10,
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
            }}>
              Your camera feed is being broadcast to viewers at /live/{sessionId}
            </p>
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 10,
          }}>
            Authentication Status
          </h2>
          {user ? (
            <>
              <p style={{
                color: 'rgba(0,255,0,0.8)',
                fontSize: 14,
                fontFamily: 'monospace',
                marginBottom: 10,
                wordBreak: 'break-all',
              }}>
                ✅ Logged in
                <br />
                User ID: {user.id}
                <br />
                Email: {user.email}
              </p>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="nav-btn"
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  background: 'linear-gradient(135deg, #666 0%, #333 100%)',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <p style={{
                color: 'rgba(255,255,0,0.8)',
                fontSize: 14,
                marginBottom: 10,
              }}>
                ⚠️ Not logged in
              </p>
              <Link href="/login" className="nav-btn" style={{
                display: 'inline-block',
                padding: '8px 16px',
                fontSize: 14,
                textDecoration: 'none',
              }}>
                Go to Login →
              </Link>
            </>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 30,
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 15,
          }}>
            Current Session
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            fontFamily: 'monospace',
            marginBottom: 0,
          }}>
            {sessionId ? `Session ID: ${sessionId}` : 'No active session'}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 30,
        }}>
          <button
            onClick={testInsert}
            disabled={loading || !user}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading || !user ? 0.5 : 1,
              cursor: loading || !user ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Working...' : '➕ Create New Session'}
          </button>

          <button
            onClick={goLive}
            disabled={loading || !sessionId || !user || isStreaming}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading || !sessionId || !user || isStreaming ? 0.5 : 1,
              cursor: loading || !sessionId || !user || isStreaming ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            }}
          >
            {loading ? '⏳ Working...' : '🔴 Go Live (Start Camera)'}
          </button>

          <button
            onClick={endLive}
            disabled={loading || !sessionId || !user || !isStreaming}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading || !sessionId || !user || !isStreaming ? 0.5 : 1,
              cursor: loading || !sessionId || !user || !isStreaming ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #666 0%, #333 100%)',
            }}
          >
            {loading ? '⏳ Working...' : '⏹️ End Live (Stop Camera)'}
          </button>

          <button
            onClick={fetchAllSessions}
            disabled={loading || !user}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading || !user ? 0.5 : 1,
              cursor: loading || !user ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #4444ff 0%, #0000cc 100%)',
            }}
          >
            {loading ? '⏳ Working...' : '📋 Fetch My Sessions'}
          </button>
        </div>

        {status && (
          <div style={{
            background: status.includes('✅') 
              ? 'rgba(0,255,0,0.1)' 
              : status.includes('❌')
              ? 'rgba(255,0,0,0.1)'
              : 'rgba(255,255,0,0.1)',
            border: `1px solid ${status.includes('✅') 
              ? 'rgba(0,255,0,0.3)' 
              : status.includes('❌')
              ? 'rgba(255,0,0,0.3)'
              : 'rgba(255,255,0,0.3)'}`,
            borderRadius: 8,
            padding: 16,
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: 'monospace',
            wordBreak: 'break-word',
          }}>
            {status}
          </div>
        )}

        <div style={{
          marginTop: 40,
          padding: 20,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
        }}>
          <p style={{ margin: 0, marginBottom: 10 }}>
            <strong>Instructions:</strong>
          </p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            <li>Sign in at /login with your email (magic link)</li>
            <li>Click "Create New Session" to insert with your user_id (UUID)</li>
            <li>Click "Go Live" - allow camera/mic permissions</li>
            <li>Open /live/{'{sessionId}'} in another tab to watch</li>
            <li>Click "End Live" to stop streaming</li>
          </ol>
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            <strong>WebRTC Note:</strong> Uses Google STUN servers for peer-to-peer connection. Supabase Realtime handles signaling.
          </p>
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
