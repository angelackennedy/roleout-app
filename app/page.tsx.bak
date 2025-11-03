'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/time-utils";

type LiveSession = {
  id: string;
  user_id: string;
  title: string;
  is_live: boolean;
  started_at: string;
  ended_at: string | null;
  viewers: number;
};

export default function Home() {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('is_live', true)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching live sessions:', error);
      } else {
        setLiveSessions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching live sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSessions();

    // Subscribe to realtime changes on live_sessions table
    const channel = supabase
      .channel('live_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_sessions',
        },
        (payload) => {
          console.log('Live sessions change detected:', payload);
          fetchLiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="flex flex-col gap-8 items-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center">Welcome to ROLE OUT</h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400">
          A video social platform with transparent moderation
        </p>

        {/* Live Now Section */}
        {!loading && liveSessions.length > 0 && (
          <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ff0000',
                animation: 'pulse 2s infinite',
              }} />
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
              }}>
                Live Now
              </h2>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {liveSessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}>
                      {session.title}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.6)',
                    }}>
                      Started {formatRelativeTime(session.started_at)} • {session.viewers} {session.viewers === 1 ? 'viewer' : 'viewers'}
                    </div>
                  </div>
                  <Link
                    href={`/live/${session.id}`}
                    className="nav-btn"
                    style={{
                      padding: '8px 16px',
                      fontSize: 14,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
          <section
            className="grid"
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              padding: "10px 0 60px",
            }}
          >
            <Link href="/feed" className="card">
              <div className="card-icon">📰</div>
              <div>
                <div className="card-title">Feed</div>
                <div className="card-sub">Browse video posts</div>
              </div>
            </Link>

            <Link href="/upload" className="card">
              <div className="card-icon">📤</div>
              <div>
                <div className="card-title">Upload</div>
                <div className="card-sub">Share a video (≤60 s)</div>
              </div>
            </Link>

            <Link href="/profile" className="card">
              <div className="card-icon">👤</div>
              <div>
                <div className="card-title">Profile</div>
                <div className="card-sub">View your profile</div>
              </div>
            </Link>

            <Link href="/moderation" className="card">
              <div className="card-icon">🛡️</div>
              <div>
                <div className="card-title">Moderation</div>
                <div className="card-sub">Transparency Panel (FA³)</div>
              </div>
            </Link>

            <Link href="/wallet" className="card">
              <div className="card-icon">💰</div>
              <div>
                <div className="card-title">Wallet</div>
                <div className="card-sub">Placeholder (FA³)</div>
              </div>
            </Link>

            <Link href="/metrics" className="card">
              <div className="card-icon">📊</div>
              <div>
                <div className="card-title">Metrics</div>
                <div className="card-sub">Analytics (FA³)</div>
              </div>
            </Link>
          </section>
        </div>
      </main>

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
