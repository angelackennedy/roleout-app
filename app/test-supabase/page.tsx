'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testInsert = async () => {
    setLoading(true);
    setStatus('Inserting new live session...');

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .insert({
          user_id: 'test-user-' + Date.now(),
          title: 'Test Live Session ' + new Date().toLocaleTimeString(),
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
    if (!sessionId) {
      setStatus('⚠️ Please create a session first');
      return;
    }

    setLoading(true);
    setStatus('Going live...');

    try {
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
      } else {
        console.log('Go live success:', data);
        setStatus(`✅ Session ${sessionId} is now LIVE! 🔴`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus(`❌ Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const endLive = async () => {
    if (!sessionId) {
      setStatus('⚠️ Please create a session first');
      return;
    }

    setLoading(true);
    setStatus('Ending live session...');

    try {
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
    setLoading(true);
    setStatus('Fetching all sessions...');

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Fetch error:', error);
        setStatus(`❌ Error: ${error.message}`);
      } else {
        console.log('Fetched sessions:', data);
        setStatus(`✅ Fetched ${data.length} sessions (check console for details)`);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus(`❌ Unexpected error: ${err.message}`);
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
        maxWidth: 600,
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
          Supabase Connection Test
        </h1>
        
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 30,
          fontSize: 14,
        }}>
          Test your connection to the live_sessions table
        </p>

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
            disabled={loading}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Working...' : '➕ Create New Session'}
          </button>

          <button
            onClick={goLive}
            disabled={loading || !sessionId}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading || !sessionId ? 0.5 : 1,
              cursor: loading || !sessionId ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            }}
          >
            {loading ? '⏳ Working...' : '🔴 Go Live'}
          </button>

          <button
            onClick={endLive}
            disabled={loading || !sessionId}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading || !sessionId ? 0.5 : 1,
              cursor: loading || !sessionId ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #666 0%, #333 100%)',
            }}
          >
            {loading ? '⏳ Working...' : '⏹️ End Live'}
          </button>

          <button
            onClick={fetchAllSessions}
            disabled={loading}
            className="nav-btn"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #4444ff 0%, #0000cc 100%)',
            }}
          >
            {loading ? '⏳ Working...' : '📋 Fetch All Sessions'}
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
            <li>Click "Create New Session" to insert a test row</li>
            <li>Click "Go Live" to set is_live=true and update started_at</li>
            <li>Click "End Live" to set is_live=false and set ended_at</li>
            <li>Click "Fetch All Sessions" to see recent entries in console</li>
          </ol>
          <p style={{ marginTop: 10, marginBottom: 0 }}>
            Check your browser console (F12) for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
}
